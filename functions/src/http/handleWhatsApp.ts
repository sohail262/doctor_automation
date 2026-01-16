import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Doctor } from '../types';
import { logger } from '../utils/logger';
import {
    parseWhatsAppWebhook,
    sendWhatsAppMessage,
    TwilioWebhookPayload,
} from '../services/twilio.service';
import {
    parseAppointmentRequest,
    generateWhatsAppResponse,
} from '../services/openai.service';
import {
    getAvailableSlots,
    bookAppointment,
    cancelAppointment,
} from '../services/calendar.service';
import { format, parseISO, addDays } from 'date-fns';

const db = admin.firestore();

// Map phone numbers to doctor IDs (in production, use a proper lookup)
const DOCTOR_PHONE_MAP: Record<string, string> = {
    // 'whatsapp:+1234567890': 'doctor-id-here'
};

export const handleWhatsApp = functions.https.onRequest(async (req, res) => {
    console.log('WhatsApp webhook received');

    // Verify this is a POST request
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    try {
        const payload = parseWhatsAppWebhook(req.body);
        console.log('Parsed payload:', payload);

        // Find the doctor based on the To number
        const doctorId = await findDoctorByPhone(payload.To);

        if (!doctorId) {
            console.log('No doctor found for number:', payload.To);
            res.status(200).send('OK'); // Still acknowledge to Twilio
            return;
        }

        // Get doctor info
        const doctorDoc = await db.collection('doctors').doc(doctorId).get();
        const doctor = doctorDoc.data() as Doctor;

        if (!doctor || !doctor.whatsappConfig?.enabled) {
            res.status(200).send('OK');
            return;
        }

        // Process the message
        await processWhatsAppMessage(doctorId, doctor, payload);

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('WhatsApp handler error:', error);
        res.status(500).send('Error processing message');
    }
});

async function findDoctorByPhone(phone: string): Promise<string | null> {
    // Check static map first
    if (DOCTOR_PHONE_MAP[phone]) {
        return DOCTOR_PHONE_MAP[phone];
    }

    // Search Firestore
    const snapshot = await db
        .collection('doctors')
        .where('whatsappConfig.phoneNumber', '==', phone.replace('whatsapp:', ''))
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].id;
}

async function processWhatsAppMessage(
    doctorId: string,
    doctor: Doctor,
    payload: TwilioWebhookPayload
): Promise<void> {
    const { From, Body, ProfileName } = payload;
    const patientName = ProfileName || 'Patient';
    const patientPhone = From.replace('whatsapp:', '');

    // Log incoming message
    await logger.info(
        doctorId,
        'WHATSAPP_RECEIVED',
        `Message from ${patientName}: ${Body.substring(0, 100)}`,
        { from: patientPhone }
    );

    // Check for quick commands
    const lowerBody = Body.toLowerCase().trim();

    if (lowerBody === 'cancel') {
        await handleCancelRequest(doctorId, doctor, patientPhone, patientName);
        return;
    }

    if (lowerBody === 'confirm') {
        await handleConfirmRequest(doctorId, patientPhone, patientName);
        return;
    }

    // Parse the message intent using AI
    const parsed = await parseAppointmentRequest(Body, doctor.name);
    console.log('Parsed intent:', parsed);

    switch (parsed.intent) {
        case 'book':
            await handleBookingRequest(doctorId, doctor, patientPhone, patientName, parsed);
            break;

        case 'cancel':
            await handleCancelRequest(doctorId, doctor, patientPhone, patientName);
            break;

        case 'reschedule':
            await handleRescheduleRequest(doctorId, doctor, patientPhone, patientName);
            break;

        case 'info':
            await handleInfoRequest(doctorId, doctor, patientPhone);
            break;

        default:
            await handleUnknownRequest(doctorId, doctor, patientPhone, Body);
            break;
    }
}

async function handleBookingRequest(
    doctorId: string,
    doctor: Doctor,
    patientPhone: string,
    patientName: string,
    parsed: { date?: string; time?: string; reason?: string }
): Promise<void> {
    try {
        // Determine the date
        let requestedDate: Date;
        if (parsed.date) {
            requestedDate = parseISO(parsed.date);
        } else {
            // Default to tomorrow
            requestedDate = addDays(new Date(), 1);
        }

        // Get available slots
        const slots = await getAvailableSlots(
            doctorId,
            requestedDate,
            doctor.calendarConfig?.slotDuration || 30
        );

        if (slots.length === 0) {
            await sendWhatsAppMessage(
                patientPhone,
                `Sorry, there are no available slots on ${format(requestedDate, 'EEEE, MMMM d')}. Would you like to try another day?`
            );
            return;
        }

        // If time was specified, try to book that slot
        if (parsed.time) {
            const [hours, minutes] = parsed.time.split(':').map(Number);
            const requestedTime = new Date(requestedDate);
            requestedTime.setHours(hours, minutes, 0, 0);

            const matchingSlot = slots.find(
                (slot) => slot.start.getTime() === requestedTime.getTime()
            );

            if (matchingSlot) {
                // Book the appointment
                await bookAppointment(
                    doctorId,
                    patientName,
                    patientPhone,
                    matchingSlot.start,
                    doctor.calendarConfig?.slotDuration || 30,
                    parsed.reason || 'General consultation',
                    'whatsapp'
                );

                await sendWhatsAppMessage(
                    patientPhone,
                    `✅ Your appointment is confirmed!\n\n📅 ${format(matchingSlot.start, 'EEEE, MMMM d, yyyy')}\n⏰ ${format(matchingSlot.start, 'h:mm a')}\n\nWe'll send you a reminder before your appointment.`
                );
                return;
            }
        }

        // Show available slots
        const slotsList = slots
            .slice(0, 5)
            .map((slot, i) => `${i + 1}. ${format(slot.start, 'h:mm a')}`)
            .join('\n');

        await sendWhatsAppMessage(
            patientPhone,
            `Available times on ${format(requestedDate, 'EEEE, MMMM d')}:\n\n${slotsList}\n\nReply with a number to book, or specify a time like "Book 2pm".`
        );

    } catch (error: any) {
        console.error('Booking error:', error);
        await sendWhatsAppMessage(
            patientPhone,
            `Sorry, I couldn't process your booking request. Please try again or call our office directly.`
        );
    }
}

async function handleCancelRequest(
    doctorId: string,
    doctor: Doctor,
    patientPhone: string,
    patientName: string
): Promise<void> {
    // Find upcoming appointments for this patient
    const appointmentsSnapshot = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .where('patientPhone', '==', patientPhone)
        .where('status', 'in', ['scheduled', 'confirmed'])
        .where('appointmentTime', '>=', Timestamp.now())
        .orderBy('appointmentTime', 'asc')
        .limit(1)
        .get();

    if (appointmentsSnapshot.empty) {
        await sendWhatsAppMessage(
            patientPhone,
            `I couldn't find any upcoming appointments for you. Would you like to book one?`
        );
        return;
    }

    const appointment = appointmentsSnapshot.docs[0];
    const appointmentData = appointment.data();

    await cancelAppointment(doctorId, appointment.id);

    await sendWhatsAppMessage(
        patientPhone,
        `Your appointment on ${format(appointmentData.appointmentTime.toDate(), 'MMMM d')} at ${format(appointmentData.appointmentTime.toDate(), 'h:mm a')} has been cancelled. Would you like to reschedule?`
    );

    await logger.info(
        doctorId,
        'APPOINTMENT_CANCELLED',
        `Appointment cancelled via WhatsApp for ${patientName}`,
        { appointmentId: appointment.id }
    );
}

async function handleConfirmRequest(
    doctorId: string,
    patientPhone: string,
    patientName: string
): Promise<void> {
    const appointmentsSnapshot = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .where('patientPhone', '==', patientPhone)
        .where('status', '==', 'scheduled')
        .where('appointmentTime', '>=', Timestamp.now())
        .orderBy('appointmentTime', 'asc')
        .limit(1)
        .get();

    if (appointmentsSnapshot.empty) {
        await sendWhatsAppMessage(
            patientPhone,
            `No pending appointments to confirm. Your appointments are already confirmed or you don't have any upcoming visits.`
        );
        return;
    }

    const appointment = appointmentsSnapshot.docs[0];

    await appointment.ref.update({ status: 'confirmed' });

    await sendWhatsAppMessage(
        patientPhone,
        `✅ Thank you! Your appointment is confirmed. See you soon!`
    );
}

async function handleRescheduleRequest(
    _doctorId: string,
    _doctor: Doctor,
    patientPhone: string,
    _patientName: string
): Promise<void> {
    await sendWhatsAppMessage(
        patientPhone,
        `To reschedule, please let me know your preferred date and time. For example: "Book Tuesday at 3pm"`
    );
}

async function handleInfoRequest(
    _doctorId: string,
    doctor: Doctor,
    patientPhone: string
): Promise<void> {
    const info = `🏥 ${doctor.name}\n${doctor.specialty}\n\n📍 ${doctor.address}\n📞 ${doctor.phone}\n\nTo book an appointment, just let me know your preferred date and time!`;

    await sendWhatsAppMessage(patientPhone, info);
}

async function handleUnknownRequest(
    doctorId: string,
    doctor: Doctor,
    patientPhone: string,
    originalMessage: string
): Promise<void> {
    const response = await generateWhatsAppResponse(
        `Patient sent: "${originalMessage}". They may want to book, cancel, or ask about appointments.`,
        doctor.name,
        doctor.specialty
    );

    await sendWhatsAppMessage(patientPhone, response);
}