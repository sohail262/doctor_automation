import Replicate from 'replicate';
import * as functions from 'firebase-functions';

const replicate = new Replicate({
    auth: functions.config().replicate?.token || process.env.REPLICATE_API_TOKEN,
});

export async function generateImage(prompt: string): Promise<string | null> {
    try {
        const enhancedPrompt = `Professional medical/healthcare themed image: ${prompt}. 
Clean, modern, trustworthy aesthetic. No text overlays. High quality.`;

        const output = await replicate.run(
            'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            {
                input: {
                    prompt: enhancedPrompt,
                    negative_prompt: 'text, watermark, low quality, blurry, graphic, violent, scary',
                    width: 1024,
                    height: 1024,
                    num_outputs: 1,
                    scheduler: 'K_EULER',
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                },
            }
        );

        if (Array.isArray(output) && output.length > 0) {
            return output[0] as string;
        }

        return null;
    } catch (error) {
        console.error('Image generation failed:', error);
        return null;
    }
}

export async function generateImageFromTopic(topic: string, specialty: string): Promise<string | null> {
    const prompt = `${specialty} healthcare professional concept about ${topic}. 
Modern clinic setting, warm lighting, professional atmosphere.`;

    return generateImage(prompt);
}