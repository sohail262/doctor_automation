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
exports.batchPoster = void 0;
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
exports.batchPoster = functions.pubsub
    .topic('post-trigger')
    .onPublish(async (message) => {
    console.log('Batch poster triggered');
    const now = firestore_1.Timestamp.now();
    try {
        // Query doctors who need posts
        const doctorsSnapshot = await db
            .collection('doctors')
            .where('active', '==', true)
            .where('onboarded', '==', true)
            .where('automationSettings.nextPostTime', '<=', now)
            .limit(BATCH_SIZE)
            .get();
        console.log(`Found ${doctorsSnapshot.size} doctors needing posts`);
        const results = await Promise.allSettled(doctorsSnapshot.docs.map((doc) => processDoctor(doc.id, doc.data())));
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(`Batch complete: ${successful} successful, ${failed} failed`);
        return { successful, failed };
    }
    catch (error) {
        console.error('Batch poster error:', error);
        throw error;
    }
});
async function processDoctor(doctorId, doctor) {
    console.log(`Processing doctor: ${doctorId}`);
    try {
        // Check if GMB is configured and auto-post is enabled
        if (!doctor.gmbConfig?.connected || !doctor.gmbConfig?.autoPostEnabled) {
            console.log(`Skipping ${doctorId}: GMB not configured or auto-post disabled`);
            // Still update next post time to prevent repeated processing
            await updateNextPostTime(doctorId, doctor);
            return;
        }
        // Select a random topic
        const topic = (0, helpers_1.selectRandomTopic)(doctor.topics || []);
        // Generate content
        const content = await (0, openai_service_1.generatePostContent)(doctor.name, doctor.specialty, topic, 'google_my_business');
        if (!content) {
            throw new Error('Failed to generate content');
        }
        // Generate image (optional, don't fail if it doesn't work)
        let imageUrl = null;
        try {
            imageUrl = await (0, gemini_service_1.generateImageFromTopic)(topic, doctor.specialty);
        }
        catch (imageError) {
            console.warn('Image generation failed, proceeding without image:', imageError);
        }
        // Save post to Firestore first
        const post = {
            doctorId,
            type: 'gmb',
            content,
            imageUrl,
            status: 'pending',
            postedAt: null,
            createdAt: firestore_1.Timestamp.now(),
            error: null,
        };
        const postId = await (0, gmb_service_1.savePostToFirestore)(doctorId, post);
        // Post to GMB
        if (doctor.gmbConfig.accessToken && doctor.gmbConfig.locationId) {
            const result = await (0, gmb_service_1.createGMBPost)(doctor.gmbConfig.accessToken, doctor.gmbConfig.locationId, content, imageUrl);
            if (result.success) {
                await (0, gmb_service_1.updatePostStatus)(doctorId, postId, 'posted');
                await logger_1.logger.success(doctorId, 'GMB_POST_SUCCESS', `Posted to GMB: ${content.substring(0, 50)}...`, { postId, topic });
            }
            else {
                await (0, gmb_service_1.updatePostStatus)(doctorId, postId, 'failed', result.error);
                await logger_1.logger.error(doctorId, 'GMB_POST_FAILED', `Failed to post to GMB: ${result.error}`, { postId, topic });
            }
        }
        else {
            // No GMB credentials, mark as pending for manual posting
            await logger_1.logger.warning(doctorId, 'GMB_POST_PENDING', 'Post created but GMB credentials not configured', { postId });
        }
        // Update next post time
        await updateNextPostTime(doctorId, doctor);
    }
    catch (error) {
        console.error(`Failed to process doctor ${doctorId}:`, error);
        await logger_1.logger.error(doctorId, 'POST_GENERATION_ERROR', `Failed to generate/post content: ${error.message}`);
        // Still update next post time to prevent infinite retries
        await updateNextPostTime(doctorId, doctor);
        throw error;
    }
}
async function updateNextPostTime(doctorId, doctor) {
    const nextPostTime = (0, helpers_1.calculateNextPostTime)(doctor.automationSettings?.gmbPostFrequency || 'daily', doctor.automationSettings?.gmbPostTime || '09:00');
    await db.collection('doctors').doc(doctorId).update({
        'automationSettings.nextPostTime': nextPostTime,
    });
}
//# sourceMappingURL=batchPoster.js.map