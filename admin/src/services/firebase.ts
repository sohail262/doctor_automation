import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Admin callable functions
export const adminFunctions = {
    // Doctors
    getDoctors: httpsCallable(functions, 'adminGetDoctors'),
    getDoctor: httpsCallable(functions, 'adminGetDoctor'),
    updateDoctor: httpsCallable(functions, 'adminUpdateDoctor'),
    suspendDoctor: httpsCallable(functions, 'adminSuspendDoctor'),
    deleteDoctor: httpsCallable(functions, 'adminDeleteDoctor'),
    impersonateDoctor: httpsCallable(functions, 'adminImpersonateDoctor'),

    // Workflows
    getWorkflows: httpsCallable(functions, 'adminGetWorkflows'),
    getWorkflow: httpsCallable(functions, 'adminGetWorkflow'),
    updateWorkflow: httpsCallable(functions, 'adminUpdateWorkflow'),
    triggerWorkflow: httpsCallable(functions, 'adminTriggerWorkflow'),
    pauseWorkflow: httpsCallable(functions, 'adminPauseWorkflow'),
    getWorkflowRuns: httpsCallable(functions, 'adminGetWorkflowRuns'),

    // Logs
    getLogs: httpsCallable(functions, 'adminGetLogs'),
    getAuditLogs: httpsCallable(functions, 'adminGetAuditLogs'),
    exportLogs: httpsCallable(functions, 'adminExportLogs'),

    // Analytics
    getAnalytics: httpsCallable(functions, 'adminGetAnalytics'),
    getDoctorAnalytics: httpsCallable(functions, 'adminGetDoctorAnalytics'),

    // System
    getSystemHealth: httpsCallable(functions, 'adminGetSystemHealth'),
    getSystemSettings: httpsCallable(functions, 'adminGetSystemSettings'),
    updateSystemSettings: httpsCallable(functions, 'adminUpdateSystemSettings'),

    // API Keys
    getAPIKeys: httpsCallable(functions, 'adminGetAPIKeys'),
    updateAPIKey: httpsCallable(functions, 'adminUpdateAPIKey'),
    testAPIKey: httpsCallable(functions, 'adminTestAPIKey'),
};

export default app;