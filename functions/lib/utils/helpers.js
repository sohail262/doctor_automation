"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNextPostTime = calculateNextPostTime;
exports.selectRandomTopic = selectRandomTopic;
exports.truncateText = truncateText;
exports.parseTimeString = parseTimeString;
exports.isWithinWorkingHours = isWithinWorkingHours;
exports.sanitizeForFirestore = sanitizeForFirestore;
const firestore_1 = require("firebase-admin/firestore");
const date_fns_1 = require("date-fns");
function calculateNextPostTime(frequency, postTime) {
    const [hours, minutes] = postTime.split(':').map(Number);
    let nextDate = new Date();
    // Set the time
    nextDate = (0, date_fns_1.setHours)(nextDate, hours);
    nextDate = (0, date_fns_1.setMinutes)(nextDate, minutes);
    // If time has passed today, move to next occurrence
    if (nextDate <= new Date()) {
        switch (frequency) {
            case 'daily':
                nextDate = (0, date_fns_1.addDays)(nextDate, 1);
                break;
            case 'weekly':
                nextDate = (0, date_fns_1.addWeeks)(nextDate, 1);
                break;
            case 'biweekly':
                nextDate = (0, date_fns_1.addWeeks)(nextDate, 2);
                break;
        }
    }
    return firestore_1.Timestamp.fromDate(nextDate);
}
function selectRandomTopic(topics) {
    if (topics.length === 0)
        return 'general health tips';
    return topics[Math.floor(Math.random() * topics.length)];
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}
function parseTimeString(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
}
function isWithinWorkingHours(date, workingHours) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = workingHours[dayName];
    if (!dayHours || !dayHours.enabled)
        return false;
    const currentTime = date.getHours() * 60 + date.getMinutes();
    const [startHours, startMinutes] = dayHours.start.split(':').map(Number);
    const [endHours, endMinutes] = dayHours.end.split(':').map(Number);
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;
    return currentTime >= startTime && currentTime <= endTime;
}
function sanitizeForFirestore(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined)
            continue;
        if (value === null) {
            sanitized[key] = null;
        }
        else if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof firestore_1.Timestamp)) {
            sanitized[key] = sanitizeForFirestore(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
//# sourceMappingURL=helpers.js.map