import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Appointment, Doctor } from '../types';
import { logger } from '../utils/logger';
import { sendAppointmentConfirmation } from '../services/twilio.service';

const db = admin.firestore();

export const onAppointmentCreate = functions.firestore
    .document('doctors/{doctorId}/appointments/{appointmentId}')
    .onCreate(async (snap, context) => {
        const { doctorId, appointmentId } = context.params;
        const appointment = snap.data() as Appointment;

        console.log(`New appointment created: ${appointmentId} for doctor ${doctorId}`);

        try {
            // Get doctor info
            const doctorDoc = await db.collection('doctors').doc(doctorId).get();
            const doctor = doctorDoc.data() as Doctor;

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            // Send confirmation via WhatsApp if enabled
            if (doctor.whatsappConfig?.enabled && appointment.patientPhone) {
                try {
                    await sendAppointmentConfirmation(
                        appointment.patientPhone,
                        appointment.patientName,
                        doctor.name,
                        appointment.appointmentTime.toDate(),
                        appointment.duration
                    );

                    await logger.success(
                        doctorId,
                        'APPOINTMENT_CONFIRMATION',
                        `Confirmation sent to ${appointment.patientName} for ${appointment.appointmentTime.toDate().toLocaleString()}`
                    );
                } catch (whatsappError: any) {
                    await logger.warning(
                        doctorId,
                        'APPOINTMENT_CONFIRMATION_FAILED',
                        `Failed to send WhatsApp confirmation: ${whatsappError.message}`
                    );
                }
            }

            // Log the appointment creation
            await logger.info(
                doctorId,
                'APPOINTMENT_CREATED',
                `New appointment: ${appointment.patientName} on ${appointment.appointmentTime.toDate().toLocaleString()}`,
                {
                    appointmentId,
                    patientName: appointment.patientName,
                    source: appointment.source,
                }
            );

            return { success: true };
        } catch (error: any) {
            console.error(`Failed to process appointment ${appointmentId}:`, error);

            await logger.error(
                doctorId,
                'APPOINTMENT_ERROR',
                `Failed to process appointment: ${error.message}`
            );

            return { success: false, error: error.message };
        }
    });