import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Doctor } from '../types';
import { logger } from '../utils/logger';
import { generateReviewReply } from '../services/openai.service';
import { replyToGMBReview } from '../services/gmb.service';

const db = admin.firestore();

export const onReviewReceived = functions.pubsub
    .topic('reviewQueue')
    .onPublish(async (message, context) => {
        const data = message.json;
        const { doctorId, reviewName, reviewerName, rating, comment } = data;

        try {
            // Fetch doctor specific settings and knowledge base
            const doctorDoc = await db.collection('doctors').doc(doctorId).get();
            if (!doctorDoc.exists) {
                throw new Error(`Doctor ${doctorId} not found`);
            }

            const doctor = doctorDoc.data() as Doctor;


            // Check if auto-reply is enabled
            if (doctor.gmbConfig && doctor.gmbConfig.autoReplyEnabled === false) {
                await logger.info(doctorId, 'AUTO_REPLY_SKIPPED', 'Auto-reply is disabled for this doctor');
                return;
            }

            // Generate reply using LLM
            const replyText = await generateReviewReply(
                doctor.name,
                doctor.specialty || 'Doctor',
                reviewerName,
                rating,
                comment,
                doctor.knowledgeBase || []
            );

            // Fetch GMB Access Token 
            const accessToken = doctor.gmbConfig?.accessToken;

            if (!accessToken) {
                // If no token in doc, try to see if we can use a system/platform token context, relying on config
                throw new Error('No GMB access token available in doctor profile');
            }

            // Post reply to GMB
            const result = await replyToGMBReview(accessToken, reviewName, replyText);

            if (result.success) {
                await logger.success(
                    doctorId,
                    'AUTO_REPLY_SENT',
                    `Replied to ${reviewerName}: "${replyText.substring(0, 50)}..."`
                );
            } else {
                throw new Error(result.error);
            }

        } catch (error: any) {
            console.error(`Failed to process review for doctor ${doctorId}:`, error);
            await logger.error(
                doctorId,
                'AUTO_REPLY_FAILED',
                `Failed to reply to review: ${error.message}`
            );
            // We might want to throw to trigger retry for transient errors
        }
    });
