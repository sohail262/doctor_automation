import OpenAI from 'openai';
import * as functions from 'firebase-functions';


const openai = new OpenAI({
    apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

export async function generatePostContent(
    doctorName: string,
    specialty: string,
    topic: string,
    platform: string = 'google_my_business'
): Promise<string> {
    const platformInstructions: Record<string, string> = {
        google_my_business: 'Keep it professional and informative. Max 1500 characters. Include a call to action.',
        facebook: 'Be friendly and engaging. Can be longer. Include emojis sparingly.',
        instagram: 'Be visual and trendy. Include relevant hashtags at the end.',
        twitter: 'Be concise. Max 280 characters. Include 1-2 hashtags.',
        linkedin: 'Be professional and thought-leadership focused.',
    };

    const prompt = `You are a social media manager for ${doctorName}, a ${specialty}. 
Generate a ${platform.replace('_', ' ')} post about: ${topic}

Guidelines:
- ${platformInstructions[platform] || platformInstructions.google_my_business}
- Be authentic and helpful
- Include relevant health information
- Do NOT include medical advice that requires consultation
- Make it engaging for patients

Generate ONLY the post content, no explanations.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
    });

    return completion.choices[0].message.content?.trim() || '';
}

export async function generateReviewReply(
    doctorName: string,
    specialty: string,
    reviewerName: string,
    rating: number,
    reviewText: string,
    knowledgeBase: string[]
): Promise<string> {
    const kbContext = knowledgeBase.length > 0
        ? `Follow these guidelines:\n${knowledgeBase.join('\n')}`
        : '';

    const prompt = `You are ${doctorName}, a ${specialty}. 
A patient named ${reviewerName} left a ${rating}-star review:
"${reviewText}"

${kbContext}

Write a professional, empathetic reply that:
- Thanks them for their feedback
- Addresses any concerns if negative (${rating} < 4)
- Maintains HIPAA compliance (don't reference specific treatments)
- Is warm but professional
- Encourages them to return/contact if issues

Generate ONLY the reply, no explanations. Keep under 500 characters.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.6,
    });

    return completion.choices[0].message.content?.trim() || '';
}

export async function parseAppointmentRequest(
    message: string,
    doctorName: string
): Promise<{
    intent: 'book' | 'cancel' | 'reschedule' | 'info' | 'unknown';
    date?: string;
    time?: string;
    reason?: string;
    patientName?: string;
}> {
    const prompt = `Parse this WhatsApp message for a dental/medical appointment booking with ${doctorName}:
"${message}"

Extract:
- intent: "book", "cancel", "reschedule", "info", or "unknown"
- date: in YYYY-MM-DD format if mentioned (interpret relative dates like "tomorrow")
- time: in HH:MM format if mentioned
- reason: brief reason for visit if mentioned
- patientName: patient's name if mentioned

Today's date is ${new Date().toISOString().split('T')[0]}.

Respond ONLY with valid JSON, no markdown:`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.1,
    });

    try {
        const content = completion.choices[0].message.content || '{}';
        // Remove markdown code blocks if present
        const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch {
        return { intent: 'unknown' };
    }
}

export async function generateWhatsAppResponse(
    context: string,
    doctorName: string,
    specialty: string
): Promise<string> {
    const prompt = `You are an AI assistant for ${doctorName}'s ${specialty} practice responding via WhatsApp.
Context: ${context}

Generate a brief, friendly response. Be helpful but direct. Max 200 characters.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
    });

    return completion.choices[0].message.content?.trim() || '';
}