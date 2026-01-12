import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    updateDoc,
    deleteDoc,
    addDoc,
    Timestamp,
    writeBatch,
    onSnapshot,
    DocumentSnapshot,
} from 'firebase/firestore';
import { db, adminFunctions } from './firebase';
import type {
    DoctorAdmin,
    DoctorFilters,
    PaginationParams,
    PaginatedResult,
    Workflow,
    WorkflowRun,
    SystemLog,
    LogFilters,
    AuditLog,
    AdminNote,
    SystemSettings,
    APIKey,
} from '@/types/admin';

// ==================== DOCTORS ====================

export async function getDoctors(
    filters: DoctorFilters,
    pagination: PaginationParams
): Promise<PaginatedResult<DoctorAdmin>> {
    const result = await adminFunctions.getDoctors({ filters, pagination });
    return result.data as PaginatedResult<DoctorAdmin>;
}

export async function getDoctor(doctorId: string): Promise<DoctorAdmin | null> {
    const result = await adminFunctions.getDoctor({ doctorId });
    return result.data as DoctorAdmin | null;
}

export async function updateDoctor(
    doctorId: string,
    updates: Partial<DoctorAdmin>
): Promise<void> {
    await adminFunctions.updateDoctor({ doctorId, updates });
}

export async function suspendDoctor(
    doctorId: string,
    reason: string
): Promise<void> {
    await adminFunctions.suspendDoctor({ doctorId, reason });
}

export async function unsuspendDoctor(doctorId: string): Promise<void> {
    await adminFunctions.updateDoctor({
        doctorId,
        updates: { status: 'active', suspensionReason: null },
    });
}

export async function deleteDoctor(doctorId: string): Promise<void> {
    await adminFunctions.deleteDoctor({ doctorId });
}

export async function addDoctorNote(
    doctorId: string,
    note: Omit<AdminNote, 'id' | 'createdAt'>
): Promise<void> {
    const noteData: AdminNote = {
        ...note,
        id: crypto.randomUUID(),
        createdAt: Timestamp.now(),
    };

    const doctorRef = doc(db, 'doctors', doctorId);
    const doctorDoc = await getDoc(doctorRef);
    const currentNotes = doctorDoc.data()?.notes || [];

    await updateDoc(doctorRef, {
        notes: [...currentNotes, noteData],
    });
}

export async function updateDoctorTags(
    doctorId: string,
    tags: string[]
): Promise<void> {
    await updateDoc(doc(db, 'doctors', doctorId), { tags });
}

export async function bulkUpdateDoctors(
    doctorIds: string[],
    updates: Partial<DoctorAdmin>
): Promise<void> {
    const batch = writeBatch(db);

    doctorIds.forEach((id) => {
        const ref = doc(db, 'doctors', id);
        batch.update(ref, { ...updates, updatedAt: Timestamp.now() });
    });

    await batch.commit();
}

export function subscribeToDoctorChanges(
    doctorId: string,
    callback: (doctor: DoctorAdmin) => void
): () => void {
    return onSnapshot(doc(db, 'doctors', doctorId), (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as DoctorAdmin);
        }
    });
}

// ==================== WORKFLOWS ====================

export async function getWorkflows(): Promise<Workflow[]> {
    const result = await adminFunctions.getWorkflows({});
    return result.data as Workflow[];
}

export async function getWorkflow(workflowId: string): Promise<Workflow | null> {
    const result = await adminFunctions.getWorkflow({ workflowId });
    return result.data as Workflow | null;
}

export async function updateWorkflow(
    workflowId: string,
    updates: Partial<Workflow>
): Promise<void> {
    await adminFunctions.updateWorkflow({ workflowId, updates });
}

export async function triggerWorkflow(
    workflowId: string,
    options?: { doctorIds?: string[]; dryRun?: boolean }
): Promise<string> {
    const result = await adminFunctions.triggerWorkflow({
        workflowId,
        options,
    });
    return (result.data as { runId: string }).runId;
}

export async function pauseWorkflow(workflowId: string): Promise<void> {
    await adminFunctions.pauseWorkflow({ workflowId });
}

export async function resumeWorkflow(workflowId: string): Promise<void> {
    await adminFunctions.updateWorkflow({
        workflowId,
        updates: { status: 'active' },
    });
}

export async function getWorkflowRuns(
    workflowId: string,
    limit: number = 50
): Promise<WorkflowRun[]> {
    const result = await adminFunctions.getWorkflowRuns({ workflowId, limit });
    return result.data as WorkflowRun[];
}

export function subscribeToWorkflowRun(
    runId: string,
    callback: (run: WorkflowRun) => void
): () => void {
    return onSnapshot(doc(db, 'workflowRuns', runId), (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as WorkflowRun);
        }
    });
}

// ==================== LOGS ====================

export async function getLogs(
    filters: LogFilters,
    pagination: PaginationParams
): Promise<PaginatedResult<SystemLog>> {
    const result = await adminFunctions.getLogs({ filters, pagination });
    return result.data as PaginatedResult<SystemLog>;
}

export async function getAuditLogs(
    pagination: PaginationParams
): Promise<PaginatedResult<AuditLog>> {
    const result = await adminFunctions.getAuditLogs({ pagination });
    return result.data as PaginatedResult<AuditLog>;
}

export async function exportLogs(
    filters: LogFilters,
    format: 'csv' | 'json'
): Promise<string> {
    const result = await adminFunctions.exportLogs({ filters, format });
    return (result.data as { url: string }).url;
}

export function subscribeToLogs(
    callback: (logs: SystemLog[]) => void,
    limit: number = 100
): () => void {
    const q = query(
        collection(db, 'systemLogs'),
        orderBy('createdAt', 'desc'),
        limit
    );

    return onSnapshot(q, (snap) => {
        const logs = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as SystemLog[];
        callback(logs);
    });
}

// ==================== SYSTEM ====================

export async function getSystemHealth(): Promise<any> {
    const result = await adminFunctions.getSystemHealth({});
    return result.data;
}

export async function getSystemSettings(): Promise<SystemSettings> {
    const result = await adminFunctions.getSystemSettings({});
    return result.data as SystemSettings;
}

export async function updateSystemSettings(
    updates: Partial<SystemSettings>
): Promise<void> {
    await adminFunctions.updateSystemSettings({ updates });
}

export async function getAPIKeys(): Promise<APIKey[]> {
    const result = await adminFunctions.getAPIKeys({});
    return result.data as APIKey[];
}

export async function updateAPIKey(
    keyId: string,
    updates: Partial<APIKey>
): Promise<void> {
    await adminFunctions.updateAPIKey({ keyId, updates });
}

export async function testAPIKey(service: string): Promise<{
    success: boolean;
    latency: number;
    error?: string;
}> {
    const result = await adminFunctions.testAPIKey({ service });
    return result.data as any;
}