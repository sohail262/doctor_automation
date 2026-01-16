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
exports.onDoctorCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
const db = admin.firestore();
exports.onDoctorCreate = functions.firestore
    .document('doctors/{doctorId}')
    .onCreate(async (snap, context) => {
    const doctorId = context.params.doctorId;
    const doctor = snap.data();
    console.log(`New doctor created: ${doctorId}`);
    try {
        // Log the onboarding start
        await logger_1.logger.info(doctorId, 'ONBOARD_START', `Doctor ${doctor.name || doctor.email} created account`);
        // Set initial automation times if not set
        const updates = {};
        if (!doctor.automationSettings?.nextPostTime) {
            const nextPostTime = (0, helpers_1.calculateNextPostTime)(doctor.automationSettings?.gmbPostFrequency || 'daily', doctor.automationSettings?.gmbPostTime || '09:00');
            updates.automationSettings = {
                ...doctor.automationSettings,
                nextPostTime,
                nextSocialPostTime: (0, helpers_1.calculateNextPostTime)(doctor.automationSettings?.socialPostFrequency || 'daily', doctor.automationSettings?.socialPostTime || '10:00'),
            };
        }
        // Check/Create GMB Profile
        if (!doctor.gmbConfig?.locationId) {
            await logger_1.logger.info(doctorId, 'GMB_SETUP_START', 'Checking GMB Profile');
            // For this to work, we need an access token. 
            // In a real scenario, the doctor logs in via OAuth, saving the token.
            // We assume doctor.gmbConfig.accessToken exists or we have a system token.
            const accessToken = doctor.gmbConfig?.accessToken || process.env.SYSTEM_GMB_TOKEN;
            if (accessToken) {
                const { createGMBLocation, generateWebsiteForLocation, updateLocationWebsite } = require('../services/gmb.service');
                const gmbResult = await createGMBLocation(accessToken, doctor.name, doctor.address || 'Unknown Address', doctor.specialty || 'General Practitioner');
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
                    await logger_1.logger.success(doctorId, 'GMB_SETUP_COMPLETE', `Created GMB Location: ${gmbResult.locationName}`);
                    // Check/Create Website
                    if (!doctor.gmbConfig?.websiteUrl) {
                        const siteResult = await generateWebsiteForLocation(gmbResult.locationName, doctor.name, doctor.specialty);
                        if (siteResult.success && siteResult.websiteUrl) {
                            newGmbConfig.websiteUrl = siteResult.websiteUrl;
                            await logger_1.logger.success(doctorId, 'WEBSITE_GENERATED', `Generated website: ${siteResult.websiteUrl}`);
                            // Link website to GMB
                            await updateLocationWebsite(accessToken, gmbResult.locationName, siteResult.websiteUrl);
                        }
                    }
                    updates.gmbConfig = newGmbConfig;
                }
                else {
                    await logger_1.logger.error(doctorId, 'GMB_SETUP_FAILED', gmbResult.error || 'Unknown error');
                }
            }
            else {
                await logger_1.logger.warning(doctorId, 'GMB_SETUP_SKIPPED', 'No Access Token found');
            }
        }
        if (Object.keys(updates).length > 0) {
            await snap.ref.update(updates);
        }
        // Create initial log collection
        await db.collection('logs').doc(doctorId).set({
            doctorId,
            createdAt: firestore_1.Timestamp.now(),
        });
        await logger_1.logger.success(doctorId, 'ONBOARD_COMPLETE', 'Account setup completed successfully');
        return { success: true };
    }
    catch (error) {
        console.error(`Failed to process new doctor ${doctorId}:`, error);
        await logger_1.logger.error(doctorId, 'ONBOARD_ERROR', `Account setup failed: ${error.message}`);
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=onDoctorCreate.js.map