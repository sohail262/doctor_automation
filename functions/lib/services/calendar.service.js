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
exports.getAvailableSlots = getAvailableSlots;
exports.bookAppointment = bookAppointment;
exports.syncToGoogleCalendar = syncToGoogleCalendar;
exports.cancelAppointment = cancelAppointment;
exports.getUpcomingAppointments = getUpcomingAppointments;
exports.getAppointmentsNeedingReminder = getAppointmentsNeedingReminder;
const googleapis_1 = require("googleapis");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
async function getAvailableSlots(doctorId, date, slotDuration = 30) {
    const doctorDoc = await db.collection('doctors').doc(doctorId).get();
    const doctor = doctorDoc.data();
    if (!doctor?.calendarConfig) {
        throw new Error('Calendar not configured');
    }
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingHours = doctor.calendarConfig.workingHours[dayName];
    if (!workingHours?.enabled) {
        return []; // Closed on this day
    }
    // Get existing appointments for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const appointmentsSnapshot = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .where('appointmentTime', '>=', firestore_1.Timestamp.fromDate(startOfDay))
        .where('appointmentTime', '<=', firestore_1.Timestamp.fromDate(endOfDay))
        .where('status', 'in', ['scheduled', 'confirmed'])
        .get();
    const bookedSlots = appointmentsSnapshot.docs.map((doc) => {
        const appt = doc.data();
        return {
            start: appt.appointmentTime.toDate(),
            end: new Date(appt.appointmentTime.toDate().getTime() + appt.duration * 60000),
        };
    });
    // Generate available slots
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    const slots = [];
    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMin, 0, 0);
    const workingEnd = new Date(date);
    workingEnd.setHours(endHour, endMin, 0, 0);
    while (slotStart.getTime() + slotDuration * 60000 <= workingEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        // Check if slot overlaps with any booked appointment
        const isBooked = bookedSlots.some((booked) => (slotStart >= booked.start && slotStart < booked.end) ||
            (slotEnd > booked.start && slotEnd <= booked.end) ||
            (slotStart <= booked.start && slotEnd >= booked.end));
        if (!isBooked) {
            slots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
        }
        // Move to next slot
        slotStart.setTime(slotStart.getTime() + slotDuration * 60000);
    }
    return slots;
}
async function bookAppointment(doctorId, patientName, patientPhone, appointmentTime, duration, reason, source = 'whatsapp') {
    const doctorDoc = await db.collection('doctors').doc(doctorId).get();
    const doctor = doctorDoc.data();
    if (!doctor) {
        throw new Error('Doctor not found');
    }
    // Verify slot is available
    const slots = await getAvailableSlots(doctorId, appointmentTime, duration);
    const isSlotAvailable = slots.some((slot) => slot.start.getTime() === appointmentTime.getTime());
    if (!isSlotAvailable) {
        throw new Error('Selected time slot is not available');
    }
    // Create appointment
    const appointment = {
        doctorId,
        patientName,
        patientPhone,
        appointmentTime: firestore_1.Timestamp.fromDate(appointmentTime),
        duration,
        reason,
        status: 'scheduled',
        reminderSent: false,
        source,
        createdAt: firestore_1.Timestamp.now(),
    };
    const appointmentRef = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .add(appointment);
    // Sync to Google Calendar if connected
    if (doctor.calendarConfig?.connected && doctor.calendarConfig?.accessToken) {
        try {
            await syncToGoogleCalendar(doctor, {
                ...appointment,
                id: appointmentRef.id,
            });
        }
        catch (error) {
            console.error('Failed to sync to Google Calendar:', error);
        }
    }
    return {
        ...appointment,
        id: appointmentRef.id,
    };
}
async function syncToGoogleCalendar(doctor, appointment) {
    if (!doctor.calendarConfig?.accessToken || !doctor.calendarConfig?.calendarId) {
        return null;
    }
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: doctor.calendarConfig.accessToken,
        refresh_token: doctor.calendarConfig.refreshToken,
    });
    const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
    const appointmentDate = appointment.appointmentTime.toDate();
    const endDate = new Date(appointmentDate.getTime() + appointment.duration * 60000);
    const event = {
        summary: `Appointment: ${appointment.patientName}`,
        description: `Patient: ${appointment.patientName}\nPhone: ${appointment.patientPhone}\nReason: ${appointment.reason}\nSource: ${appointment.source}`,
        start: {
            dateTime: appointmentDate.toISOString(),
            timeZone: 'America/New_York', // TODO: Make configurable
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/New_York',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 30 },
            ],
        },
    };
    const response = await calendar.events.insert({
        calendarId: doctor.calendarConfig.calendarId,
        requestBody: event,
    });
    return response.data.id || null;
}
async function cancelAppointment(doctorId, appointmentId) {
    const appointmentRef = db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .doc(appointmentId);
    await appointmentRef.update({
        status: 'cancelled',
    });
}
async function getUpcomingAppointments(doctorId, limitCount = 50) {
    const now = firestore_1.Timestamp.now();
    const snapshot = await db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .where('appointmentTime', '>=', now)
        .where('status', 'in', ['scheduled', 'confirmed'])
        .orderBy('appointmentTime', 'asc')
        .limit(limitCount)
        .get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}
async function getAppointmentsNeedingReminder(reminderHours = 24) {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(reminderWindow.getTime() + 60 * 60 * 1000); // 1 hour window
    const doctorsSnapshot = await db
        .collection('doctors')
        .where('active', '==', true)
        .get();
    const results = [];
    for (const doctorDoc of doctorsSnapshot.docs) {
        const appointmentsSnapshot = await doctorDoc.ref
            .collection('appointments')
            .where('appointmentTime', '>=', firestore_1.Timestamp.fromDate(reminderWindow))
            .where('appointmentTime', '<=', firestore_1.Timestamp.fromDate(reminderWindowEnd))
            .where('status', 'in', ['scheduled', 'confirmed'])
            .where('reminderSent', '==', false)
            .get();
        for (const apptDoc of appointmentsSnapshot.docs) {
            results.push({
                doctorId: doctorDoc.id,
                appointment: { id: apptDoc.id, ...apptDoc.data() },
            });
        }
    }
    return results;
}
//# sourceMappingURL=calendar.service.js.map