import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Doctor } from '../types';
import { logger } from '../utils/logger';
import { calculateNextPostTime } from '../utils/helpers';

const db = admin.firestore();

export const onDoctorCreate = functions.firestore
    .document('doctors/{doctorId}')
    .onCreate(async (snap, context) => {
        const doctorId = context.params.doctorId;
        const doctor = snap.data() as Doctor;

        console.log(`New doctor created: ${doctorId}`);

        try {
            // Log the onboarding start
            await logger.info(
                doctorId,
                'ONBOARD_START',
                `Doctor ${doctor.name || doctor.email} created account`
            );

            // Set initial automation times if not set
            const updates: Partial<Doctor> = {};

            if (!doctor.automationSettings?.nextPostTime) {
                const nextPostTime = calculateNextPostTime(
                    doctor.automationSettings?.gmbPostFrequency || 'daily',
                    doctor.automationSettings?.gmbPostTime || '09:00'
                );

                updates.automationSettings = {
                    ...doctor.automationSettings,
                    nextPostTime,
                    nextSocialPostTime: calculateNextPostTime(
                        doctor.automationSettings?.socialPostFrequency || 'daily',
                        doctor.automationSettings?.socialPostTime || '10:00'
                    ),
                } as any;
            }

            if (Object.keys(updates).length > 0) {
                await snap.ref.update(updates);
            }

            // Create initial log collection
            await db.collection('logs').doc(doctorId).set({
                doctorId,
                createdAt: Timestamp.now(),
            });

            await logger.success(
                doctorId,
                'ONBOARD_COMPLETE',
                'Account setup completed successfully'
            );

            return { success: true };
        } catch (error: any) {
            console.error(`Failed to process new doctor ${doctorId}:`, error);

            await logger.error(
                doctorId,
                'ONBOARD_ERROR',
                `Account setup failed: ${error.message}`
            );

            return { success: false, error: error.message };
        }
    });