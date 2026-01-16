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
exports.onReviewReceived = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../utils/logger");
const openai_service_1 = require("../services/openai.service");
const gmb_service_1 = require("../services/gmb.service");
const db = admin.firestore();
exports.onReviewReceived = functions.pubsub
    .topic('reviewQueue')
    .onPublish(async (message, context) => {
    const data = message.json;
    const { doctorId, reviewName, reviewerName, rating, comment } = data;
    try {
        // Fetch doctor specific settings and knowledge base
        const doctorDoc = await db.collection('doctors').doc(doctorId).get();
        if (!doctorDoc.exists) {
            throw new Error(`Doctor ${doctorId} not found`);
        }
        const doctor = doctorDoc.data();
        // Check if auto-reply is enabled
        if (doctor.gmbConfig && doctor.gmbConfig.autoReplyEnabled === false) {
            await logger_1.logger.info(doctorId, 'AUTO_REPLY_SKIPPED', 'Auto-reply is disabled for this doctor');
            return;
        }
        // Generate reply using LLM
        const replyText = await (0, openai_service_1.generateReviewReply)(doctor.name, doctor.specialty || 'Doctor', reviewerName, rating, comment, doctor.knowledgeBase || []);
        // Fetch GMB Access Token 
        const accessToken = doctor.gmbConfig?.accessToken;
        if (!accessToken) {
            // If no token in doc, try to see if we can use a system/platform token context, relying on config
            throw new Error('No GMB access token available in doctor profile');
        }
        // Post reply to GMB
        const result = await (0, gmb_service_1.replyToGMBReview)(accessToken, reviewName, replyText);
        if (result.success) {
            await logger_1.logger.success(doctorId, 'AUTO_REPLY_SENT', `Replied to ${reviewerName}: "${replyText.substring(0, 50)}..."`);
        }
        else {
            throw new Error(result.error);
        }
    }
    catch (error) {
        console.error(`Failed to process review for doctor ${doctorId}:`, error);
        await logger_1.logger.error(doctorId, 'AUTO_REPLY_FAILED', `Failed to reply to review: ${error.message}`);
        // We might want to throw to trigger retry for transient errors
    }
});
//# sourceMappingURL=onReviewReceived.js.map