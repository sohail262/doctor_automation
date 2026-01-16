import { Timestamp } from 'firebase-admin/firestore';
import { addDays, addWeeks, setHours, setMinutes } from 'date-fns';

export function calculateNextPostTime(
    frequency: 'daily' | 'weekly' | 'biweekly',
    postTime: string
): Timestamp {
    const [hours, minutes] = postTime.split(':').map(Number);
    let nextDate = new Date();

    // Set the time
    nextDate = setHours(nextDate, hours);
    nextDate = setMinutes(nextDate, minutes);

    // If time has passed today, move to next occurrence
    if (nextDate <= new Date()) {
        switch (frequency) {
            case 'daily':
                nextDate = addDays(nextDate, 1);
                break;
            case 'weekly':
                nextDate = addWeeks(nextDate, 1);
                break;
            case 'biweekly':
                nextDate = addWeeks(nextDate, 2);
                break;
        }
    }

    return Timestamp.fromDate(nextDate);
}

export function selectRandomTopic(topics: string[]): string {
    if (topics.length === 0) return 'general health tips';
    return topics[Math.floor(Math.random() * topics.length)];
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
}

export function isWithinWorkingHours(
    date: Date,
    workingHours: Record<string, { start: string; end: string; enabled: boolean }>
): boolean {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = workingHours[dayName];

    if (!dayHours || !dayHours.enabled) return false;

    const currentTime = date.getHours() * 60 + date.getMinutes();
    const [startHours, startMinutes] = dayHours.start.split(':').map(Number);
    const [endHours, endMinutes] = dayHours.end.split(':').map(Number);

    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    return currentTime >= startTime && currentTime <= endTime;
}

export function sanitizeForFirestore(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        if (value === null) {
            sanitized[key] = null;
        } else if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
            sanitized[key] = sanitizeForFirestore(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}