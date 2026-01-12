import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

// Verify admin role
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

// Get doctors with filters and pagination
export const adminGetDoctors = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);

    const { filters = {}, pagination = { page: 1, limit: 25, sortBy: 'createdAt', sortOrder: 'desc' } } = data;

    let query: admin.firestore.Query = db.collection('doctors');

    // Apply filters
    if (filters.status) {
        query = query.where('status', '==', filters.status);
    }
    if (filters.plan) {
        query = query.where('plan', '==', filters.plan);
    }
    if (filters.onboarded !== undefined) {
        query = query.where('onboarded', '==', filters.onboarded);
    }
    if (filters.active !== undefined) {
        query = query.where('active', '==', filters.active);
    }
    if (filters.hasGMB !== undefined) {
        query = query.where('gmbConfig.connected', '==', filters.hasGMB);
    }

    // Count total
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply sorting
    query = query.orderBy(pagination.sortBy, pagination.sortOrder);

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.offset(offset).limit(pagination.limit);

    const snapshot = await query.get();

    const doctors = await Promise.all(
        snapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Get stats
            const postsSnapshot = await doc.ref.collection('posts').count().get();
            const appointmentsSnapshot = await doc.ref.collection('appointments').count().get();

            return {
                id: doc.id,
                ...data,
                stats: {
                    totalPosts: postsSnapshot.data().count,
                    totalAppointments: appointmentsSnapshot.data().count,
                    ...data.stats,
                },
            };
        })
    );

    return {
        data: doctors,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
    };
});

// Get single doctor
export const adminGetDoctor = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);

    const { doctorId } = data;
    if (!doctorId) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID required');
    }

    const doctorDoc = await db.collection('doctors').doc(doctorId).get();
    if (!doctorDoc.exists) {
        return null;
    }

    const doctor = doctorDoc.data();

    // Get stats
    const [postsSnapshot, appointmentsSnapshot, reviewsSnapshot] = await Promise.all([
        doctorDoc.ref.collection('posts').count().get(),
        doctorDoc.ref.collection('appointments').count().get(),
        doctorDoc.ref.collection('reviews').count().get(),
    ]);

    return {
        id: doctorDoc.id,
        ...doctor,
        stats: {
            totalPosts: postsSnapshot.data().count,
            totalAppointments: appointmentsSnapshot.data().count,
            totalReviews: reviewsSnapshot.data().count,
            ...doctor?.stats,
        },
    };
});

// Update doctor
export const adminUpdateDoctor = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);

    const { doctorId, updates } = data;
    if (!doctorId || !updates) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID and updates required');
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.id;
    delete updates.email;
    delete updates.createdAt;

    await db.collection('doctors').doc(doctorId).update({
        ...updates,
        updatedAt: Timestamp.now(),
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'UPDATE_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        changes: Object.keys(updates).map((key) => ({ field: key, newValue: updates[key] })),
        createdAt: Timestamp.now(),
    });

    return { success: true };
});

// Suspend doctor
export const adminSuspendDoctor = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);

    const { doctorId, reason } = data;
    if (!doctorId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID and reason required');
    }

    await db.collection('doctors').doc(doctorId).update({
        status: 'suspended',
        suspensionReason: reason,
        active: false,
        updatedAt: Timestamp.now(),
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'SUSPEND_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        changes: [{ field: 'status', oldValue: 'active', newValue: 'suspended' }],
        metadata: { reason },
        createdAt: Timestamp.now(),
    });

    return { success: true };
});

// Delete doctor
export const adminDeleteDoctor = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);

    const { doctorId } = data;
    if (!doctorId) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID required');
    }

    // Soft delete - mark as deleted
    await db.collection('doctors').doc(doctorId).update({
        status: 'deleted',
        active: false,
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'DELETE_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        createdAt: Timestamp.now(),
    });

    return { success: true };
});

// Impersonate doctor (generate custom token)
export const adminImpersonateDoctor = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);

    if (adminData?.role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only super admins can impersonate');
    }

    const { doctorId } = data;
    if (!doctorId) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID required');
    }

    // Generate custom token
    const customToken = await admin.auth().createCustomToken(doctorId, {
        impersonatedBy: context.auth!.uid,
    });

    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth!.uid,
        adminEmail: adminData?.email,
        action: 'IMPERSONATE_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        createdAt: Timestamp.now(),
    });

    return { token: customToken };
});