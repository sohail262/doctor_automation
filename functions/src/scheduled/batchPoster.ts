import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Doctor, Post } from '../types';
import { logger } from '../utils/logger';
import { calculateNextPostTime, selectRandomTopic } from '../utils/helpers';
import { generatePostContent } from '../services/openai.service';
import { generateImageFromTopic } from '../services/replicate.service';
import { createGMBPost, savePostToFirestore, updatePostStatus } from '../services/gmb.service';

const db = admin.firestore();
const BATCH_SIZE = 50;

export const batchPoster = functions.pubsub
    .topic('post-trigger')
    .onPublish(async (message) => {
        console.log('Batch poster triggered');

        const now = Timestamp.now();

        try {
            // Query doctors who need posts
            const doctorsSnapshot = await db
                .collection('doctors')
                .where('active', '==', true)
                .where('onboarded', '==', true)
                .where('automationSettings.nextPostTime', '<=', now)
                .limit(BATCH_SIZE)
                .get();

            console.log(`Found ${doctorsSnapshot.size} doctors needing posts`);

            const results = await Promise.allSettled(
                doctorsSnapshot.docs.map((doc) => processDoctor(doc.id, doc.data() as Doctor))
            );

            const successful = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.filter((r) => r.status === 'rejected').length;

            console.log(`Batch complete: ${successful} successful, ${failed} failed`);

            return { successful, failed };
        } catch (error) {
            console.error('Batch poster error:', error);
            throw error;
        }
    });

async function processDoctor(doctorId: string, doctor: Doctor): Promise<void> {
    console.log(`Processing doctor: ${doctorId}`);

    try {
        // Check if GMB is configured and auto-post is enabled
        if (!doctor.gmbConfig?.connected || !doctor.gmbConfig?.autoPostEnabled) {
            console.log(`Skipping ${doctorId}: GMB not configured or auto-post disabled`);

            // Still update next post time to prevent repeated processing
            await updateNextPostTime(doctorId, doctor);
            return;
        }

        // Select a random topic
        const topic = selectRandomTopic(doctor.topics || []);

        // Generate content
        const content = await generatePostContent(
            doctor.name,
            doctor.specialty,
            topic,
            'google_my_business'
        );

        if (!content) {
            throw new Error('Failed to generate content');
        }

        // Generate image (optional, don't fail if it doesn't work)
        let imageUrl: string | null = null;
        try {
            imageUrl = await generateImageFromTopic(topic, doctor.specialty);
        } catch (imageError) {
            console.warn('Image generation failed, proceeding without image:', imageError);
        }

        // Save post to Firestore first
        const post: Omit<Post, 'id'> = {
            doctorId,
            type: 'gmb',
            content,
            imageUrl,
            status: 'pending',
            postedAt: null,
            createdAt: Timestamp.now(),
            error: null,
        };

        const postId = await savePostToFirestore(doctorId, post);

        // Post to GMB
        if (doctor.gmbConfig.accessToken && doctor.gmbConfig.locationId) {
            const result = await createGMBPost(
                doctor.gmbConfig.accessToken,
                doctor.gmbConfig.locationId,
                content,
                imageUrl
            );

            if (result.success) {
                await updatePostStatus(doctorId, postId, 'posted');
                await logger.success(
                    doctorId,
                    'GMB_POST_SUCCESS',
                    `Posted to GMB: ${content.substring(0, 50)}...`,
                    { postId, topic }
                );
            } else {
                await updatePostStatus(doctorId, postId, 'failed', result.error);
                await logger.error(
                    doctorId,
                    'GMB_POST_FAILED',
                    `Failed to post to GMB: ${result.error}`,
                    { postId, topic }
                );
            }
        } else {
            // No GMB credentials, mark as pending for manual posting
            await logger.warning(
                doctorId,
                'GMB_POST_PENDING',
                'Post created but GMB credentials not configured',
                { postId }
            );
        }

        // Update next post time
        await updateNextPostTime(doctorId, doctor);

    } catch (error: any) {
        console.error(`Failed to process doctor ${doctorId}:`, error);

        await logger.error(
            doctorId,
            'POST_GENERATION_ERROR',
            `Failed to generate/post content: ${error.message}`
        );

        // Still update next post time to prevent infinite retries
        await updateNextPostTime(doctorId, doctor);

        throw error;
    }
}

async function updateNextPostTime(doctorId: string, doctor: Doctor): Promise<void> {
    const nextPostTime = calculateNextPostTime(
        doctor.automationSettings?.gmbPostFrequency || 'daily',
        doctor.automationSettings?.gmbPostTime || '09:00'
    );

    await db.collection('doctors').doc(doctorId).update({
        'automationSettings.nextPostTime': nextPostTime,
    });
}