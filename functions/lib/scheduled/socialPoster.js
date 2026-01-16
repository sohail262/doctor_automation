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
exports.socialPoster = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
const openai_service_1 = require("../services/openai.service");
const gemini_service_1 = require("../services/gemini.service");
const gmb_service_1 = require("../services/gmb.service");
const db = admin.firestore();
const BATCH_SIZE = 50;
exports.socialPoster = functions.pubsub
    .topic('social-trigger')
    .onPublish(async (message) => {
    console.log('Social poster triggered');
    const now = firestore_1.Timestamp.now();
    try {
        const doctorsSnapshot = await db
            .collection('doctors')
            .where('active', '==', true)
            .where('onboarded', '==', true)
            .where('automationSettings.nextSocialPostTime', '<=', now)
            .limit(BATCH_SIZE)
            .get();
        console.log(`Found ${doctorsSnapshot.size} doctors needing social posts`);
        const results = await Promise.allSettled(doctorsSnapshot.docs.map((doc) => processSocialPost(doc.id, doc.data())));
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        return { successful, failed };
    }
    catch (error) {
        console.error('Social poster error:', error);
        throw error;
    }
});
async function processSocialPost(doctorId, doctor) {
    const platforms = [];
    // Check which platforms are connected
    if (doctor.socialAccounts?.facebook?.connected)
        platforms.push('facebook');
    if (doctor.socialAccounts?.instagram?.connected)
        platforms.push('instagram');
    if (doctor.socialAccounts?.twitter?.connected)
        platforms.push('twitter');
    if (doctor.socialAccounts?.linkedin?.connected)
        platforms.push('linkedin');
    if (platforms.length === 0) {
        console.log(`Skipping ${doctorId}: No social platforms connected`);
        await updateNextSocialPostTime(doctorId, doctor);
        return;
    }
    const topic = (0, helpers_1.selectRandomTopic)(doctor.topics || []);
    // Generate image once for all platforms
    let imageUrl = null;
    try {
        imageUrl = await (0, gemini_service_1.generateImageFromTopic)(topic, doctor.specialty);
    }
    catch (error) {
        console.warn('Image generation failed:', error);
    }
    for (const platform of platforms) {
        try {
            const content = await (0, openai_service_1.generatePostContent)(doctor.name, doctor.specialty, topic, platform);
            const post = {
                doctorId,
                type: platform,
                content,
                imageUrl,
                status: 'pending',
                postedAt: null,
                createdAt: firestore_1.Timestamp.now(),
                error: null,
            };
            const postId = await (0, gmb_service_1.savePostToFirestore)(doctorId, post);
            // TODO: Implement actual posting to each platform
            // For now, just save as pending
            await logger_1.logger.info(doctorId, 'SOCIAL_POST_CREATED', `Created ${platform} post: ${content.substring(0, 50)}...`, { postId, platform, topic });
        }
        catch (error) {
            await logger_1.logger.error(doctorId, 'SOCIAL_POST_ERROR', `Failed to create ${platform} post: ${error.message}`);
        }
    }
    await updateNextSocialPostTime(doctorId, doctor);
}
async function updateNextSocialPostTime(doctorId, doctor) {
    const nextSocialPostTime = (0, helpers_1.calculateNextPostTime)(doctor.automationSettings?.socialPostFrequency || 'daily', doctor.automationSettings?.socialPostTime || '10:00');
    await db.collection('doctors').doc(doctorId).update({
        'automationSettings.nextSocialPostTime': nextSocialPostTime,
    });
}
//# sourceMappingURL=socialPoster.js.map