import Twilio from 'twilio';
import * as functions from 'firebase-functions';

const accountSid = functions.config().twilio?.sid || process.env.TWILIO_ACCOUNT_SID;
const authToken = functions.config().twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = functions.config().twilio?.number || process.env.TWILIO_WHATSAPP_NUMBER;

const client = Twilio(accountSid, authToken);

export async function sendWhatsAppMessage(to: string, body: string): Promise<string> {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
        body,
        from: whatsappNumber,
        to: formattedTo,
    });

    return message.sid;
}

export async function sendAppointmentConfirmation(
    patientPhone: string,
    patientName: string,
    doctorName: string,
    appointmentTime: Date,
    duration: number
): Promise<string> {
    const formattedDate = appointmentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = appointmentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const body = `✅ Appointment Confirmed!

Hi ${patientName},

Your appointment with ${doctorName} is scheduled for:
📅 ${formattedDate}
⏰ ${formattedTime}
⏱️ Duration: ${duration} minutes

Reply "CANCEL" to cancel or "RESCHEDULE" to change your appointment.

See you soon!`;

    return sendWhatsAppMessage(patientPhone, body);
}

export async function sendAppointmentReminder(
    patientPhone: string,
    patientName: string,
    doctorName: string,
    appointmentTime: Date
): Promise<string> {
    const formattedTime = appointmentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const body = `⏰ Appointment Reminder

Hi ${patientName},

This is a reminder for your appointment with ${doctorName} today at ${formattedTime}.

Please arrive 10 minutes early. Reply "CONFIRM" to confirm or "CANCEL" if you can't make it.

See you soon!`;

    return sendWhatsAppMessage(patientPhone, body);
}

export interface TwilioWebhookPayload {
    MessageSid: string;
    From: string;
    To: string;
    Body: string;
    NumMedia: string;
    ProfileName?: string;
}

export function parseWhatsAppWebhook(body: Record<string, string>): TwilioWebhookPayload {
    return {
        MessageSid: body.MessageSid,
        From: body.From,
        To: body.To,
        Body: body.Body,
        NumMedia: body.NumMedia,
        ProfileName: body.ProfileName,
    };
}