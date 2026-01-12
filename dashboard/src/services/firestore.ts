import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    DocumentData,
    QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Doctor, Post, Appointment, LogEntry, DashboardStats } from '@/types';

// Doctor operations
export const createDoctor = async (doctorId: string, data: Partial<Doctor>): Promise<void> => {
    const doctorRef = doc(db, 'doctors', doctorId);
    await setDoc(doctorRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        active: true,
        onboarded: false,
        plan: 'free',
    });
};

export const getDoctor = async (doctorId: string): Promise<Doctor | null> => {
    const doctorRef = doc(db, 'doctors', doctorId);
    const snapshot = await getDoc(doctorRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Doctor;
};

export const updateDoctor = async (doctorId: string, data: Partial<Doctor>): Promise<void> => {
    const doctorRef = doc(db, 'doctors', doctorId);
    await updateDoc(doctorRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
};

export const subscribeToDoctor = (
    doctorId: string,
    callback: (doctor: Doctor | null) => void
): (() => void) => {
    const doctorRef = doc(db, 'doctors', doctorId);
    return onSnapshot(doctorRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }
        callback({ id: snapshot.id, ...snapshot.data() } as Doctor);
    });
};

// Posts operations
export const subscribeToPosts = (
    doctorId: string,
    callback: (posts: Post[]) => void,
    limitCount: number = 50
): (() => void) => {
    const postsRef = collection(db, 'doctors', doctorId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));

    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Post[];
        callback(posts);
    });
};

// Appointments operations
export const subscribeToAppointments = (
    doctorId: string,
    callback: (appointments: Appointment[]) => void
): (() => void) => {
    const appointmentsRef = collection(db, 'doctors', doctorId, 'appointments');
    const q = query(
        appointmentsRef,
        where('appointmentTime', '>=', Timestamp.now()),
        orderBy('appointmentTime', 'asc'),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Appointment[];
        callback(appointments);
    });
};

// Logs operations
export const subscribeToLogs = (
    doctorId: string,
    callback: (logs: LogEntry[]) => void,
    limitCount: number = 100
): (() => void) => {
    const logsRef = collection(db, 'logs', doctorId, 'entries');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount));

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as LogEntry[];
        callback(logs);
    });
};

// Dashboard stats
export const getDashboardStats = async (doctorId: string): Promise<DashboardStats> => {
    // Implementation would aggregate data from subcollections
    // For now, return placeholder
    return {
        totalPosts: 0,
        postsThisMonth: 0,
        totalAppointments: 0,
        appointmentsThisWeek: 0,
        totalReviews: 0,
        averageRating: 0,
        automationStatus: 'active',
    };
};