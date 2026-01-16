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
exports.adminImpersonateDoctor = exports.adminDeleteDoctor = exports.adminSuspendDoctor = exports.adminUpdateDoctor = exports.adminGetDoctor = exports.adminGetDoctors = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
// Verify admin role
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
// Get doctors with filters and pagination
exports.adminGetDoctors = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { filters = {}, pagination = { page: 1, limit: 25, sortBy: 'createdAt', sortOrder: 'desc' } } = data;
    let query = db.collection('doctors');
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
    const doctors = await Promise.all(snapshot.docs.map(async (doc) => {
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
    }));
    return {
        data: doctors,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
    };
});
// Get single doctor
exports.adminGetDoctor = functions.https.onCall(async (data, context) => {
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
exports.adminUpdateDoctor = functions.https.onCall(async (data, context) => {
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
        updatedAt: firestore_1.Timestamp.now(),
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'UPDATE_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        changes: Object.keys(updates).map((key) => ({ field: key, newValue: updates[key] })),
        createdAt: firestore_1.Timestamp.now(),
    });
    return { success: true };
});
// Suspend doctor
exports.adminSuspendDoctor = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);
    const { doctorId, reason } = data;
    if (!doctorId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID and reason required');
    }
    await db.collection('doctors').doc(doctorId).update({
        status: 'suspended',
        suspensionReason: reason,
        active: false,
        updatedAt: firestore_1.Timestamp.now(),
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'SUSPEND_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        changes: [{ field: 'status', oldValue: 'active', newValue: 'suspended' }],
        metadata: { reason },
        createdAt: firestore_1.Timestamp.now(),
    });
    return { success: true };
});
// Delete doctor
exports.adminDeleteDoctor = functions.https.onCall(async (data, context) => {
    const adminData = await verifyAdmin(context);
    const { doctorId } = data;
    if (!doctorId) {
        throw new functions.https.HttpsError('invalid-argument', 'Doctor ID required');
    }
    // Soft delete - mark as deleted
    await db.collection('doctors').doc(doctorId).update({
        status: 'deleted',
        active: false,
        deletedAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now(),
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'DELETE_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        createdAt: firestore_1.Timestamp.now(),
    });
    return { success: true };
});
// Impersonate doctor (generate custom token)
exports.adminImpersonateDoctor = functions.https.onCall(async (data, context) => {
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
        impersonatedBy: context.auth.uid,
    });
    // Log audit
    await db.collection('auditLogs').add({
        adminId: context.auth.uid,
        adminEmail: adminData?.email,
        action: 'IMPERSONATE_DOCTOR',
        resource: 'doctor',
        resourceId: doctorId,
        createdAt: firestore_1.Timestamp.now(),
    });
    return { token: customToken };
});
//# sourceMappingURL=doctors.js.map