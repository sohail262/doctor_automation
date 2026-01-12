import { useState, useEffect, useCallback } from 'react';
import {
    getWorkflows,
    getWorkflow,
    updateWorkflow,
    triggerWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    getWorkflowRuns,
    subscribeToWorkflowRun,
} from '@/services/admin-api';
import type { Workflow, WorkflowRun } from '@/types/admin';
import toast from 'react-hot-toast';

export function useWorkflows() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWorkflows = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getWorkflows();
            setWorkflows(data);
        } catch (error) {
            toast.error('Failed to fetch workflows');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const handleUpdateWorkflow = async (
        workflowId: string,
        updates: Partial<Workflow>
    ) => {
        try {
            await updateWorkflow(workflowId, updates);
            toast.success('Workflow updated');
            fetchWorkflows();
        } catch (error) {
            toast.error('Failed to update workflow');
            throw error;
        }
    };

    const handleTriggerWorkflow = async (
        workflowId: string,
        options?: { doctorIds?: string[]; dryRun?: boolean }
    ) => {
        try {
            const runId = await triggerWorkflow(workflowId, options);
            toast.success('Workflow triggered');
            return runId;
        } catch (error) {
            toast.error('Failed to trigger workflow');
            throw error;
        }
    };

    const handlePauseWorkflow = async (workflowId: string) => {
        try {
            await pauseWorkflow(workflowId);
            toast.success('Workflow paused');
            fetchWorkflows();
        } catch (error) {
            toast.error('Failed to pause workflow');
            throw error;
        }
    };

    const handleResumeWorkflow = async (workflowId: string) => {
        try {
            await resumeWorkflow(workflowId);
            toast.success('Workflow resumed');
            fetchWorkflows();
        } catch (error) {
            toast.error('Failed to resume workflow');
            throw error;
        }
    };

    return {
        workflows,
        loading,
        refresh: fetchWorkflows,
        updateWorkflow: handleUpdateWorkflow,
        triggerWorkflow: handleTriggerWorkflow,
        pauseWorkflow: handlePauseWorkflow,
        resumeWorkflow: handleResumeWorkflow,
    };
}

export function useWorkflow(workflowId: string | null) {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [runs, setRuns] = useState<WorkflowRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workflowId) {
            setWorkflow(null);
            setRuns([]);
            setLoading(false);
            return;
        }

        const fetch = async () => {
            setLoading(true);
            try {
                const [workflowData, runsData] = await Promise.all([
                    getWorkflow(workflowId),
                    getWorkflowRuns(workflowId),
                ]);
                setWorkflow(workflowData);
                setRuns(runsData);
            } catch (error) {
                toast.error('Failed to fetch workflow');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [workflowId]);

    return { workflow, runs, loading };
}

export function useWorkflowRun(runId: string | null) {
    const [run, setRun] = useState<WorkflowRun | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!runId) {
            setRun(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToWorkflowRun(runId, (data) => {
            setRun(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [runId]);

    return { run, loading };
}