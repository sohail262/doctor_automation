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


            // Check/Create GMB Profile
            if (!doctor.gmbConfig?.locationId) {
                await logger.info(doctorId, 'GMB_SETUP_START', 'Checking GMB Profile');

                // For this to work, we need an access token. 
                // In a real scenario, the doctor logs in via OAuth, saving the token.
                // We assume doctor.gmbConfig.accessToken exists or we have a system token.
                const accessToken = doctor.gmbConfig?.accessToken || process.env.SYSTEM_GMB_TOKEN;

                if (accessToken) {
                    const { createGMBLocation, generateWebsiteForLocation, updateLocationWebsite } = require('../services/gmb.service');

                    const gmbResult = await createGMBLocation(
                        accessToken,
                        doctor.name,
                        doctor.address || 'Unknown Address',
                        doctor.specialty || 'General Practitioner'
                    );

                    if (gmbResult.success && gmbResult.locationName) {
                        // Initialize gmbConfig if missing
                        const currentGmbConfig = doctor.gmbConfig || {
                            accountId: null, locationId: null, accessToken: null, refreshToken: null,
                            connected: false, websiteUrl: null, autoReplyEnabled: true, autoPostEnabled: true
                        };

                        const newGmbConfig = {
                            ...currentGmbConfig,
                            locationId: gmbResult.locationName,
                            connected: true
                        };

                        await logger.success(doctorId, 'GMB_SETUP_COMPLETE', `Created GMB Location: ${gmbResult.locationName}`);

                        // Check/Create Website
                        if (!doctor.gmbConfig?.websiteUrl) {
                            const siteResult = await generateWebsiteForLocation(
                                gmbResult.locationName,
                                doctor.name,
                                doctor.specialty
                            );

                            if (siteResult.success && siteResult.websiteUrl) {
                                newGmbConfig.websiteUrl = siteResult.websiteUrl;
                                await logger.success(doctorId, 'WEBSITE_GENERATED', `Generated website: ${siteResult.websiteUrl}`);

                                // Link website to GMB
                                await updateLocationWebsite(accessToken, gmbResult.locationName, siteResult.websiteUrl);
                            }
                        }

                        updates.gmbConfig = newGmbConfig;

                    } else {
                        await logger.error(doctorId, 'GMB_SETUP_FAILED', gmbResult.error || 'Unknown error');
                    }
                } else {
                    await logger.warning(doctorId, 'GMB_SETUP_SKIPPED', 'No Access Token found');
                }
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