import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import { logger } from '../utils/logger';

const pubsub = new PubSub();
const db = admin.firestore();

export const handleGMBWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const body = req.body;

        // Basic validation - check if it's a review notification
        // Note: Actual GMB webhook structure validation should be more robust
        if (!body.newReview) {
            // Log but return 200 to acknowledge webhook
            await logger.info('system', 'GMB_WEBHOOK_IGNORED', 'Received webhook that is not a new review');
            res.status(200).send('Ignored');
            return;
        }

        const locationName = body.locationName;
        const review = body.newReview;

        // Find which doctor owns this location
        // We assume we have a mapping or we query doctors collection
        const doctorsSnapshot = await db.collection('doctors')
            .where('gmbLocationName', '==', locationName)
            .limit(1)
            .get();

        if (doctorsSnapshot.empty) {
            await logger.error('system', 'GMB_WEBHOOK_ERROR', `No doctor found for location: ${locationName}`);
            res.status(200).send('Doctor not found'); // Return 200 to stop retries from GMB
            return;
        }

        const doctorId = doctorsSnapshot.docs[0].id;


        // Publish to Pub/Sub for async processing
        const topicName = 'reviewQueue';
        const messageData = {
            doctorId,
            locationName,
            reviewName: review.name,
            reviewerName: review.reviewer.displayName,
            rating: review.starRating,
            comment: review.comment || '',
            createTime: review.createTime
        };

        const dataBuffer = Buffer.from(JSON.stringify(messageData));
        await pubsub.topic(topicName).publishMessage({ data: dataBuffer });

        await logger.success(
            doctorId,
            'REVIEW_RECEIVED',
            `Queued auto-reply for review from ${review.reviewer.displayName}`
        );

        res.status(200).send('Processed');
    } catch (error: any) {
        console.error('Error handling GMB webhook:', error);
        await logger.error('system', 'GMB_WEBHOOK_FATAL', error.message);
        res.status(500).send('Internal Server Error');
    }
});
