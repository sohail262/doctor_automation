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
exports.adminGetWorkflowRuns = exports.adminPauseWorkflow = exports.adminTriggerWorkflow = exports.adminUpdateWorkflow = exports.adminGetWorkflow = exports.adminGetWorkflows = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const pubsub_1 = require("@google-cloud/pubsub");
const db = admin.firestore();
const pubsub = new pubsub_1.PubSub();
async function verifyAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Not an admin');
    }
    return adminDoc.data();
}
// Get all workflows
exports.adminGetWorkflows = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const snapshot = await db.collection('workflows').orderBy('name').get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
// Get single workflow
exports.adminGetWorkflow = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { workflowId } = data;
    if (!workflowId) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID required');
    }
    const workflowDoc = await db.collection('workflows').doc(workflowId).get();
    if (!workflowDoc.exists) {
        return null;
    }
    return {
        id: workflowDoc.id,
        ...workflowDoc.data(),
    };
});
// Update workflow
exports.adminUpdateWorkflow = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);
    const { workflowId, updates } = data;
    if (!workflowId || !updates) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID and updates required');
    }
    await db.collection('workflows').doc(workflowId).update({
        ...updates,
        updatedAt: firestore_1.Timestamp.now(),
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'UPDATE_WORKFLOW',
        resource: 'workflow',
        resourceId: workflowId,
        changes: Object.keys(updates).map((key) => ({ field: key, newValue: updates[key] })),
        createdAt: firestore_1.Timestamp.now(),
    });
    return { success: true };
});
// Trigger workflow manually
exports.adminTriggerWorkflow = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);
    const { workflowId, options = {} } = data;
    if (!workflowId) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID required');
    }
    // Get workflow
    const workflowDoc = await db.collection('workflows').doc(workflowId).get();
    if (!workflowDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Workflow not found');
    }
    const workflow = workflowDoc.data();
    // Create run record
    const runRef = await db.collection('workflowRuns').add({
        workflowId,
        status: 'running',
        startedAt: firestore_1.Timestamp.now(),
        doctorsProcessed: 0,
        successCount: 0,
        failureCount: 0,
        errors: [],
        logs: [
            {
                level: 'info',
                message: `Workflow triggered manually by ${adminData?.email}`,
                timestamp: firestore_1.Timestamp.now(),
            },
        ],
        triggeredBy: context.auth.uid,
        options,
    });
    // Determine which Pub/Sub topic to use
    const topicMap = {
        gmb_post: 'post-trigger',
        social_post: 'social-trigger',
        reminder: 'reminder-trigger',
        review_reply: 'review-trigger',
    };
    const topic = topicMap[workflow?.type] || 'post-trigger';
    // Publish message to trigger the workflow
    await pubsub.topic(topic).publishMessage({
        json: {
            runId: runRef.id,
            workflowId,
            manual: true,
            triggeredBy: context.auth.uid,
            ...options,
        },
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'TRIGGER_WORKFLOW',
        resource: 'workflow',
        resourceId: workflowId,
        metadata: { runId: runRef.id, options },
        createdAt: firestore_1.Timestamp.now(),
    });
    return { runId: runRef.id };
});
// Pause workflow
exports.adminPauseWorkflow = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);
    const { workflowId } = data;
    if (!workflowId) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID required');
    }
    await db.collection('workflows').doc(workflowId).update({
        status: 'paused',
        updatedAt: firestore_1.Timestamp.now(),
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'PAUSE_WORKFLOW',
        resource: 'workflow',
        resourceId: workflowId,
        createdAt: firestore_1.Timestamp.now(),
    });
    return { success: true };
});
// Get workflow runs
exports.adminGetWorkflowRuns = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { workflowId, limit = 50 } = data;
    if (!workflowId) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID required');
    }
    const snapshot = await db
        .collection('workflowRuns')
        .where('workflowId', '==', workflowId)
        .orderBy('startedAt', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
//# sourceMappingURL=workflows.js.map