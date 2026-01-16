"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWhatsApp = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../utils/logger");
const twilio_service_1 = require("../services/twilio.service");
const openai_service_1 = require("../services/openai.service");
const calendar_service_1 = require("../services/calendar.service");
const date_fns_1 = require("date-fns");
const db = admin.firestore();
// Map phone numbers to doctor IDs (in production, use a proper lookup)
const DOCTOR_PHONE_MAP = {
// 'whatsapp:+1234567890': 'doctor-id-here'
};
exports.handleWhatsApp = functions.https.onRequest(async (req, res) => {
    console.log('WhatsApp webhook received');
    // Verify this is a POST request
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    try {
        const payload = (0, twilio_service_1.parseWhatsAppWebhook)(req.body);
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
        const doctor = doctorDoc.data();
        if (!doctor || !doctor.whatsappConfig?.enabled) {
            res.status(200).send('OK');
            return;
        }
        // Process the message
        await processWhatsAppMessage(doctorId, doctor, payload);
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('WhatsApp handler error:', error);
        res.status(500).send('Error processing message');
    }
});
async function findDoctorByPhone(phone) {
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
async function processWhatsAppMessage(doctorId, doctor, payload) {
    const { From, Body, ProfileName } = payload;
    const patientName = ProfileName || 'Patient';
    const patientPhone = From.replace('whatsapp:', '');
    // Log incoming message
    await logger_1.logger.info(doctorId, 'WHATSAPP_RECEIVED', `Message from ${patientName}: ${Body.substring(0, 100)}`, { from: patientPhone });
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
    const parsed = await (0, openai_service_1.parseAppointmentRequest)(Body, doctor.name);
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
async function handleBookingRequest(doctorId, doctor, patientPhone, patientName, parsed) {
    try {
        // Determine the date
        let requestedDate;
        if (parsed.date) {
            requestedDate = (0, date_fns_1.parseISO)(parsed.date);
        }
        else {
            // Default to tomorrow
            requestedDate = (0, date_fns_1.addDays)(new Date(), 1);
        }
        // Get available slots
        const slots = await (0, calendar_service_1.getAvailableSlots)(doctorId, requestedDate, doctor.calendarConfig?.slotDuration || 30);
        if (slots.length === 0) {
            await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `Sorry, there are no available slots on ${(0, date_fns_1.format)(requestedDate, 'EEEE, MMMM d')}. Would you like to try another day?`);
            return;
        }
        // If time was specified, try to book that slot
        if (parsed.time) {
            const [hours, minutes] = parsed.time.split(':').map(Number);
            const requestedTime = new Date(requestedDate);
            requestedTime.setHours(hours, minutes, 0, 0);
            const matchingSlot = slots.find((slot) => slot.start.getTime() === requestedTime.getTime());
            if (matchingSlot) {
                // Book the appointment
                await (0, calendar_service_1.bookAppointment)(doctorId, patientName, patientPhone, matchingSlot.start, doctor.calendarConfig?.slotDuration || 30, parsed.reason || 'General consultation', 'whatsapp');
                await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `✅ Your appointment is confirmed!\n\n📅 ${(0, date_fns_1.format)(matchingSlot.start, 'EEEE, MMMM d, yyyy')}\n⏰ ${(0, date_fns_1.format)(matchingSlot.start, 'h:mm a')}\n\nWe'll send you a reminder before your appointment.`);
                return;
            }
        }
        // Show available slots
        const slotsList = slots
            .slice(0, 5)
            .map((slot, i) => `${i + 1}. ${(0, date_fns_1.format)(slot.start, 'h:mm a')}`)
            .join('\n');
        await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `Available times on ${(0, date_fns_1.format)(requestedDate, 'EEEE, MMMM d')}:\n\n${slotsList}\n\nReply with a number to book, or specify a time like "Book 2pm".`);
    }
    catch (error) {
        console.error('Booking error:', error);
        await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `Sorry, I couldn't process your booking request. Please try again or call our office directly.`);
    }
}
async function handleCancelRequest(doctorId, doctor, patientPhone, patientName) {
    // Find upcoming appointments for this patient
    const appointmentsSnapshot = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .where('patientPhone', '==', patientPhone)
        .where('status', 'in', ['scheduled', 'confirmed'])
        .where('appointmentTime', '>=', firestore_1.Timestamp.now())
        .orderBy('appointmentTime', 'asc')
        .limit(1)
        .get();
    if (appointmentsSnapshot.empty) {
        await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `I couldn't find any upcoming appointments for you. Would you like to book one?`);
        return;
    }
    const appointment = appointmentsSnapshot.docs[0];
    const appointmentData = appointment.data();
    await (0, calendar_service_1.cancelAppointment)(doctorId, appointment.id);
    await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `Your appointment on ${(0, date_fns_1.format)(appointmentData.appointmentTime.toDate(), 'MMMM d')} at ${(0, date_fns_1.format)(appointmentData.appointmentTime.toDate(), 'h:mm a')} has been cancelled. Would you like to reschedule?`);
    await logger_1.logger.info(doctorId, 'APPOINTMENT_CANCELLED', `Appointment cancelled via WhatsApp for ${patientName}`, { appointmentId: appointment.id });
}
async function handleConfirmRequest(doctorId, patientPhone, patientName) {
    const appointmentsSnapshot = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .where('patientPhone', '==', patientPhone)
        .where('status', '==', 'scheduled')
        .where('appointmentTime', '>=', firestore_1.Timestamp.now())
        .orderBy('appointmentTime', 'asc')
        .limit(1)
        .get();
    if (appointmentsSnapshot.empty) {
        await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `No pending appointments to confirm. Your appointments are already confirmed or you don't have any upcoming visits.`);
        return;
    }
    const appointment = appointmentsSnapshot.docs[0];
    await appointment.ref.update({ status: 'confirmed' });
    await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `✅ Thank you! Your appointment is confirmed. See you soon!`);
}
async function handleRescheduleRequest(_doctorId, _doctor, patientPhone, _patientName) {
    await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, `To reschedule, please let me know your preferred date and time. For example: "Book Tuesday at 3pm"`);
}
async function handleInfoRequest(_doctorId, doctor, patientPhone) {
    const info = `🏥 ${doctor.name}\n${doctor.specialty}\n\n📍 ${doctor.address}\n📞 ${doctor.phone}\n\nTo book an appointment, just let me know your preferred date and time!`;
    await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, info);
}
async function handleUnknownRequest(doctorId, doctor, patientPhone, originalMessage) {
    const response = await (0, openai_service_1.generateWhatsAppResponse)(`Patient sent: "${originalMessage}". They may want to book, cancel, or ask about appointments.`, doctor.name, doctor.specialty);
    await (0, twilio_service_1.sendWhatsAppMessage)(patientPhone, response);
}
//# sourceMappingURL=handleWhatsApp.js.map