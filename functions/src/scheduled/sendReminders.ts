import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Doctor, Appointment } from '../types';
import { logger } from '../utils/logger';
import { getAppointmentsNeedingReminder } from '../services/calendar.service';
import { sendAppointmentReminder } from '../services/twilio.service';

const db = admin.firestore();

export const sendReminders = functions.pubsub
    .topic('reminder-trigger')
    .onPublish(async (message) => {
        console.log('Reminder sender triggered');

        try {
            // Get all appointments needing reminders
            const appointmentsToRemind = await getAppointmentsNeedingReminder(24);

            console.log(`Found ${appointmentsToRemind.length} appointments needing reminders`);

            const results = await Promise.allSettled(
                appointmentsToRemind.map(({ doctorId, appointment }) =>
                    sendReminderForAppointment(doctorId, appointment)
                )
            );

            const successful = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.filter((r) => r.status === 'rejected').length;

            console.log(`Reminders complete: ${successful} sent, ${failed} failed`);

            return { successful, failed };
        } catch (error) {
            console.error('Reminder sender error:', error);
            throw error;
        }
    });

async function sendReminderForAppointment(
    doctorId: string,
    appointment: Appointment
): Promise<void> {
    try {
        // Get doctor info
        const doctorDoc = await db.collection('doctors').doc(doctorId).get();
        const doctor = doctorDoc.data() as Doctor;

        if (!doctor) {
            throw new Error('Doctor not found');
        }

        // Check if WhatsApp is enabled
        if (!doctor.whatsappConfig?.enabled) {
            console.log(`Skipping reminder for ${appointment.id}: WhatsApp not enabled`);
            return;
        }

        // Send reminder
        await sendAppointmentReminder(
            appointment.patientPhone,
            appointment.patientName,
            doctor.name,
            appointment.appointmentTime.toDate()
        );

        // Mark reminder as sent
        await db
            .collection('doctors')
            .doc(doctorId)
            .collection('appointments')
            .doc(appointment.id!)
            .update({ reminderSent: true });

        await logger.success(
            doctorId,
            'REMINDER_SENT',
            `Reminder sent to ${appointment.patientName} for appointment at ${appointment.appointmentTime.toDate().toLocaleString()}`,
            { appointmentId: appointment.id }
        );

    } catch (error: any) {
        await logger.error(
            doctorId,
            'REMINDER_FAILED',
            `Failed to send reminder: ${error.message}`,
            { appointmentId: appointment.id }
        );
        throw error;
    }
}