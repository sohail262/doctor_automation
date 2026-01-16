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
exports.handleGMBWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const pubsub_1 = require("@google-cloud/pubsub");
const logger_1 = require("../utils/logger");
const pubsub = new pubsub_1.PubSub();
const db = admin.firestore();
exports.handleGMBWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const body = req.body;
        // Basic validation - check if it's a review notification
        // Note: Actual GMB webhook structure validation should be more robust
        if (!body.newReview) {
            // Log but return 200 to acknowledge webhook
            await logger_1.logger.info('system', 'GMB_WEBHOOK_IGNORED', 'Received webhook that is not a new review');
            res.status(200).send('Ignored');
            return;
        }
        const locationName = body.locationName;
        const review = body.newReview;
        // Find which doctor owns this location
        // We assume we have a mapping or we query doctors collection
        const doctorsSnapshot = await db.collection('doctors')
            .where('gmbLocationName', '==', locationName)
            .limit(1)
            .get();
        if (doctorsSnapshot.empty) {
            await logger_1.logger.error('system', 'GMB_WEBHOOK_ERROR', `No doctor found for location: ${locationName}`);
            res.status(200).send('Doctor not found'); // Return 200 to stop retries from GMB
            return;
        }
        const doctorId = doctorsSnapshot.docs[0].id;
        // Publish to Pub/Sub for async processing
        const topicName = 'reviewQueue';
        const messageData = {
            doctorId,
            locationName,
            reviewName: review.name,
            reviewerName: review.reviewer.displayName,
            rating: review.starRating,
            comment: review.comment || '',
            createTime: review.createTime
        };
        const dataBuffer = Buffer.from(JSON.stringify(messageData));
        await pubsub.topic(topicName).publishMessage({ data: dataBuffer });
        await logger_1.logger.success(doctorId, 'REVIEW_RECEIVED', `Queued auto-reply for review from ${review.reviewer.displayName}`);
        res.status(200).send('Processed');
    }
    catch (error) {
        console.error('Error handling GMB webhook:', error);
        await logger_1.logger.error('system', 'GMB_WEBHOOK_FATAL', error.message);
        res.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=handleGMBWebhook.js.map