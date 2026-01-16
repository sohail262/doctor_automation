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
exports.sendReminders = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../utils/logger");
const calendar_service_1 = require("../services/calendar.service");
const twilio_service_1 = require("../services/twilio.service");
const db = admin.firestore();
exports.sendReminders = functions.pubsub
    .topic('reminder-trigger')
    .onPublish(async (message) => {
    console.log('Reminder sender triggered');
    try {
        // Get all appointments needing reminders
        const appointmentsToRemind = await (0, calendar_service_1.getAppointmentsNeedingReminder)(24);
        console.log(`Found ${appointmentsToRemind.length} appointments needing reminders`);
        const results = await Promise.allSettled(appointmentsToRemind.map(({ doctorId, appointment }) => sendReminderForAppointment(doctorId, appointment)));
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(`Reminders complete: ${successful} sent, ${failed} failed`);
        return { successful, failed };
    }
    catch (error) {
        console.error('Reminder sender error:', error);
        throw error;
    }
});
async function sendReminderForAppointment(doctorId, appointment) {
    try {
        // Get doctor info
        const doctorDoc = await db.collection('doctors').doc(doctorId).get();
        const doctor = doctorDoc.data();
        if (!doctor) {
            throw new Error('Doctor not found');
        }
        // Check if WhatsApp is enabled
        if (!doctor.whatsappConfig?.enabled) {
            console.log(`Skipping reminder for ${appointment.id}: WhatsApp not enabled`);
            return;
        }
        // Send reminder
        await (0, twilio_service_1.sendAppointmentReminder)(appointment.patientPhone, appointment.patientName, doctor.name, appointment.appointmentTime.toDate());
        // Mark reminder as sent
        await db
            .collection('doctors')
            .doc(doctorId)
            .collection('appointments')
            .doc(appointment.id)
            .update({ reminderSent: true });
        await logger_1.logger.success(doctorId, 'REMINDER_SENT', `Reminder sent to ${appointment.patientName} for appointment at ${appointment.appointmentTime.toDate().toLocaleString()}`, { appointmentId: appointment.id });
    }
    catch (error) {
        await logger_1.logger.error(doctorId, 'REMINDER_FAILED', `Failed to send reminder: ${error.message}`, { appointmentId: appointment.id });
        throw error;
    }
}
//# sourceMappingURL=sendReminders.js.map