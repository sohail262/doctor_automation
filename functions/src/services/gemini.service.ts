import * as functions from 'firebase-functions';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

// Ensure you enable the Vertex AI API in your Google Cloud Project
const PROJECT_ID = process.env.GCLOUD_PROJECT || functions.config().google?.project_id;
const LOCATION = 'us-central1'; // Imagen is available here
const API_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagegeneration@005:predict`;

export async function generateImage(prompt: string): Promise<string | null> {
    try {
        if (!PROJECT_ID) {
            console.error('Project ID not set');
            return null;
        }

        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const enhancedPrompt = `Professional medical/healthcare themed image: ${prompt}. 
Clean, modern, trustworthy aesthetic. No text overlays. High quality. Photorealistic.`;

        const requestBody = {
            instances: [
                {
                    prompt: enhancedPrompt
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1"
            }
        };

        const response = await axios.post(API_ENDPOINT, requestBody, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            }
        });

        const predictions = response.data.predictions;
        if (predictions && predictions.length > 0) {
            // Vertex AI returns Base64 encoded image
            const base64Image = predictions[0].bytesBase64Encoded;
            // In a real app, you would upload this buffer to Firebase Storage and return the URL.
            // For now, we'll return a data URI or we can mock the storage upload.

            return `data:image/png;base64,${base64Image}`;
        }

        return null;

    } catch (error: any) {
        console.error('Gemini/Imagen Image Generation failed:', error.response?.data || error.message);
        return null;
    }
}

export async function generateImageFromTopic(topic: string, specialty: string): Promise<string | null> {
    const prompt = `${specialty} healthcare professional concept about ${topic}. 
    Modern clinic setting, warm lighting, professional atmosphere.`;

    return generateImage(prompt);
}
