import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Firestore Triggers
export { onDoctorCreate } from './triggers/onDoctorCreate';
export { onAppointmentCreate } from './triggers/onAppointmentCreate';

// Scheduled Functions (Pub/Sub)
export { batchPoster } from './scheduled/batchPoster';
export { socialPoster } from './scheduled/socialPoster';
export { sendReminders } from './scheduled/sendReminders';

// HTTP Functions
export { handleWhatsApp } from './http/handleWhatsApp';
export { generatePreview } from './http/generatePreview';