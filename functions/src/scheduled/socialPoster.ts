import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Doctor, Post } from '../types';
import { logger } from '../utils/logger';
import { calculateNextPostTime, selectRandomTopic } from '../utils/helpers';
import { generatePostContent } from '../services/openai.service';
import { generateImageFromTopic } from '../services/replicate.service';
import { savePostToFirestore, updatePostStatus } from '../services/gmb.service';

const db = admin.firestore();
const BATCH_SIZE = 50;

export const socialPoster = functions.pubsub
    .topic('social-trigger')
    .onPublish(async (message) => {
        console.log('Social poster triggered');

        const now = Timestamp.now();

        try {
            const doctorsSnapshot = await db
                .collection('doctors')
                .where('active', '==', true)
                .where('onboarded', '==', true)
                .where('automationSettings.nextSocialPostTime', '<=', now)
                .limit(BATCH_SIZE)
                .get();

            console.log(`Found ${doctorsSnapshot.size} doctors needing social posts`);

            const results = await Promise.allSettled(
                doctorsSnapshot.docs.map((doc) => processSocialPost(doc.id, doc.data() as Doctor))
            );

            const successful = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.filter((r) => r.status === 'rejected').length;

            return { successful, failed };
        } catch (error) {
            console.error('Social poster error:', error);
            throw error;
        }
    });

async function processSocialPost(doctorId: string, doctor: Doctor): Promise<void> {
    const platforms: Array<'facebook' | 'instagram' | 'twitter' | 'linkedin'> = [];

    // Check which platforms are connected
    if (doctor.socialAccounts?.facebook?.connected) platforms.push('facebook');
    if (doctor.socialAccounts?.instagram?.connected) platforms.push('instagram');
    if (doctor.socialAccounts?.twitter?.connected) platforms.push('twitter');
    if (doctor.socialAccounts?.linkedin?.connected) platforms.push('linkedin');

    if (platforms.length === 0) {
        console.log(`Skipping ${doctorId}: No social platforms connected`);
        await updateNextSocialPostTime(doctorId, doctor);
        return;
    }

    const topic = selectRandomTopic(doctor.topics || []);

    // Generate image once for all platforms
    let imageUrl: string | null = null;
    try {
        imageUrl = await generateImageFromTopic(topic, doctor.specialty);
    } catch (error) {
        console.warn('Image generation failed:', error);
    }

    for (const platform of platforms) {
        try {
            const content = await generatePostContent(
                doctor.name,
                doctor.specialty,
                topic,
                platform
            );

            const post: Omit<Post, 'id'> = {
                doctorId,
                type: platform,
                content,
                imageUrl,
                status: 'pending',
                postedAt: null,
                createdAt: Timestamp.now(),
                error: null,
            };

            const postId = await savePostToFirestore(doctorId, post);

            // TODO: Implement actual posting to each platform
            // For now, just save as pending
            await logger.info(
                doctorId,
                'SOCIAL_POST_CREATED',
                `Created ${platform} post: ${content.substring(0, 50)}...`,
                { postId, platform, topic }
            );

        } catch (error: any) {
            await logger.error(
                doctorId,
                'SOCIAL_POST_ERROR',
                `Failed to create ${platform} post: ${error.message}`
            );
        }
    }

    await updateNextSocialPostTime(doctorId, doctor);
}

async function updateNextSocialPostTime(doctorId: string, doctor: Doctor): Promise<void> {
    const nextSocialPostTime = calculateNextPostTime(
        doctor.automationSettings?.socialPostFrequency || 'daily',
        doctor.automationSettings?.socialPostTime || '10:00'
    );

    await db.collection('doctors').doc(doctorId).update({
        'automationSettings.nextSocialPostTime': nextSocialPostTime,
    });
}