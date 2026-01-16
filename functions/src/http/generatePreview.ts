import * as functions from 'firebase-functions';
import { generatePostContent } from '../services/openai.service';
import { generateImageFromTopic } from '../services/gemini.service';

export const generatePreview = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { doctorName, specialty, topic, platform } = data;

    if (!doctorName || !specialty || !topic) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Missing required fields: doctorName, specialty, topic'
        );
    }

    try {
        // Generate content
        const content = await generatePostContent(
            doctorName,
            specialty,
            topic,
            platform || 'google_my_business'
        );

        // Generate image
        let imageUrl: string | null = null;
        try {
            imageUrl = await generateImageFromTopic(topic, specialty);
        } catch (error) {
            console.warn('Image generation failed:', error);
        }

        return {
            success: true,
            content,
            imageUrl,
        };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});