import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { LogEntry } from '../types';

const db = admin.firestore();

export async function log(
    doctorId: string,
    type: LogEntry['type'],
    action: string,
    message: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        const logEntry: Omit<LogEntry, 'id'> = {
            doctorId,
            type,
            action,
            message,
            metadata,
            createdAt: Timestamp.now(),
        };

        await db.collection('logs').doc(doctorId).collection('entries').add(logEntry);

        console.log(`[${type.toUpperCase()}] ${action}: ${message}`);
    } catch (error) {
        console.error('Failed to write log:', error);
    }
}

export const logger = {
    info: (doctorId: string, action: string, message: string, metadata?: Record<string, unknown>) =>
        log(doctorId, 'info', action, message, metadata),
    success: (doctorId: string, action: string, message: string, metadata?: Record<string, unknown>) =>
        log(doctorId, 'success', action, message, metadata),
    warning: (doctorId: string, action: string, message: string, metadata?: Record<string, unknown>) =>
        log(doctorId, 'warning', action, message, metadata),
    error: (doctorId: string, action: string, message: string, metadata?: Record<string, unknown>) =>
        log(doctorId, 'error', action, message, metadata),
};