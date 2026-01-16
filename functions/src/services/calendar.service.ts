import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Doctor, Appointment } from '../types';

const db = admin.firestore();

export async function getAvailableSlots(
    doctorId: string,
    date: Date,
    slotDuration: number = 30
): Promise<{ start: Date; end: Date }[]> {
    const doctorDoc = await db.collection('doctors').doc(doctorId).get();
    const doctor = doctorDoc.data() as Doctor;

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
        .where('appointmentTime', '>=', Timestamp.fromDate(startOfDay))
        .where('appointmentTime', '<=', Timestamp.fromDate(endOfDay))
        .where('status', 'in', ['scheduled', 'confirmed'])
        .get();

    const bookedSlots = appointmentsSnapshot.docs.map((doc) => {
        const appt = doc.data() as Appointment;
        return {
            start: appt.appointmentTime.toDate(),
            end: new Date(appt.appointmentTime.toDate().getTime() + appt.duration * 60000),
        };
    });

    // Generate available slots
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);

    const slots: { start: Date; end: Date }[] = [];
    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMin, 0, 0);

    const workingEnd = new Date(date);
    workingEnd.setHours(endHour, endMin, 0, 0);

    while (slotStart.getTime() + slotDuration * 60000 <= workingEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        // Check if slot overlaps with any booked appointment
        const isBooked = bookedSlots.some(
            (booked) =>
                (slotStart >= booked.start && slotStart < booked.end) ||
                (slotEnd > booked.start && slotEnd <= booked.end) ||
                (slotStart <= booked.start && slotEnd >= booked.end)
        );

        if (!isBooked) {
            slots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
        }

        // Move to next slot
        slotStart.setTime(slotStart.getTime() + slotDuration * 60000);
    }

    return slots;
}

export async function bookAppointment(
    doctorId: string,
    patientName: string,
    patientPhone: string,
    appointmentTime: Date,
    duration: number,
    reason: string,
    source: 'whatsapp' | 'manual' | 'website' = 'whatsapp'
): Promise<Appointment> {
    const doctorDoc = await db.collection('doctors').doc(doctorId).get();
    const doctor = doctorDoc.data() as Doctor;

    if (!doctor) {
        throw new Error('Doctor not found');
    }

    // Verify slot is available
    const slots = await getAvailableSlots(doctorId, appointmentTime, duration);
    const isSlotAvailable = slots.some(
        (slot) => slot.start.getTime() === appointmentTime.getTime()
    );

    if (!isSlotAvailable) {
        throw new Error('Selected time slot is not available');
    }

    // Create appointment
    const appointment: Omit<Appointment, 'id'> = {
        doctorId,
        patientName,
        patientPhone,
        appointmentTime: Timestamp.fromDate(appointmentTime),
        duration,
        reason,
        status: 'scheduled',
        reminderSent: false,
        source,
        createdAt: Timestamp.now(),
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
            } as Appointment);
        } catch (error) {
            console.error('Failed to sync to Google Calendar:', error);
        }
    }

    return {
        ...appointment,
        id: appointmentRef.id,
    } as Appointment;
}

export async function syncToGoogleCalendar(
    doctor: Doctor,
    appointment: Appointment
): Promise<string | null> {
    if (!doctor.calendarConfig?.accessToken || !doctor.calendarConfig?.calendarId) {
        return null;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: doctor.calendarConfig.accessToken,
        refresh_token: doctor.calendarConfig.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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

export async function cancelAppointment(
    doctorId: string,
    appointmentId: string
): Promise<void> {
    const appointmentRef = db
        .collection('doctors')
        .doc(doctorId)
        .collection('appointments')
        .doc(appointmentId);

    await appointmentRef.update({
        status: 'cancelled',
    });
}

export async function getUpcomingAppointments(
    doctorId: string,
    limitCount: number = 50
): Promise<Appointment[]> {
    const now = Timestamp.now();

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
    })) as Appointment[];
}

export async function getAppointmentsNeedingReminder(
    reminderHours: number = 24
): Promise<{ doctorId: string; appointment: Appointment }[]> {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(reminderWindow.getTime() + 60 * 60 * 1000); // 1 hour window

    const doctorsSnapshot = await db
        .collection('doctors')
        .where('active', '==', true)
        .get();

    const results: { doctorId: string; appointment: Appointment }[] = [];

    for (const doctorDoc of doctorsSnapshot.docs) {
        const appointmentsSnapshot = await doctorDoc.ref
            .collection('appointments')
            .where('appointmentTime', '>=', Timestamp.fromDate(reminderWindow))
            .where('appointmentTime', '<=', Timestamp.fromDate(reminderWindowEnd))
            .where('status', 'in', ['scheduled', 'confirmed'])
            .where('reminderSent', '==', false)
            .get();

        for (const apptDoc of appointmentsSnapshot.docs) {
            results.push({
                doctorId: doctorDoc.id,
                appointment: { id: apptDoc.id, ...apptDoc.data() } as Appointment,
            });
        }
    }

    return results;
}