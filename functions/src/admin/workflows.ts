import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { PubSub } from '@google-cloud/pubsub';

const db = admin.firestore();
const pubsub = new PubSub();

async function verifyAdmin(context: functions.https.CallableContext) {
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
export const adminGetWorkflows = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);

    const snapshot = await db.collection('workflows').orderBy('name').get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});

// Get single workflow
export const adminGetWorkflow = functions.https.onCall(async (data, context) => {
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
export const adminUpdateWorkflow = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);

    const { workflowId, updates } = data;
    if (!workflowId || !updates) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID and updates required');
    }

    await db.collection('workflows').doc(workflowId).update({
        ...updates,
        updatedAt: Timestamp.now(),
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'UPDATE_WORKFLOW',
        resource: 'workflow',
        resourceId: workflowId,
        changes: Object.keys(updates).map((key) => ({ field: key, newValue: updates[key] })),
        createdAt: Timestamp.now(),
    });

    return { success: true };
});

// Trigger workflow manually
export const adminTriggerWorkflow = functions.https.onCall(async (data, context) => {
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
        startedAt: Timestamp.now(),
        doctorsProcessed: 0,
        successCount: 0,
        failureCount: 0,
        errors: [],
        logs: [
            {
                level: 'info',
                message: `Workflow triggered manually by ${adminData?.email}`,
                timestamp: Timestamp.now(),
            },
        ],
        triggeredBy: context.auth!.uid,
        options,
    });

    // Determine which Pub/Sub topic to use
    const topicMap: Record<string, string> = {
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
            triggeredBy: context.auth!.uid,
            ...options,
        },
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'TRIGGER_WORKFLOW',
        resource: 'workflow',
        resourceId: workflowId,
        metadata: { runId: runRef.id, options },
        createdAt: Timestamp.now(),
    });

    return { runId: runRef.id };
});

// Pause workflow
export const adminPauseWorkflow = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);

    const { workflowId } = data;
    if (!workflowId) {
        throw new functions.https.HttpsError('invalid-argument', 'Workflow ID required');
    }

    await db.collection('workflows').doc(workflowId).update({
        status: 'paused',
        updatedAt: Timestamp.now(),
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'PAUSE_WORKFLOW',
        resource: 'workflow',
        resourceId: workflowId,
        createdAt: Timestamp.now(),
    });

    return { success: true };
});

// Get workflow runs
export const adminGetWorkflowRuns = functions.https.onCall(async (data, context) => {
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