import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Play,
    Pause,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Activity,
} from 'lucide-react';
import Layout from '@/components/Layout';
import WorkflowEditor from '@/components/WorkflowEditor';
import LogViewer from '@/components/LogViewer';
import { SimpleLineChart } from '@/components/Charts';
import { useWorkflow, useWorkflowRun } from '@/hooks/useWorkflows';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
    updateWorkflow,
    triggerWorkflow,
    pauseWorkflow,
    resumeWorkflow,
} from '@/services/admin-api';
import type { Workflow, WorkflowRun } from '@/types/admin';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const WorkflowDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { hasPermission } = useAdminAuth();

    const { workflow, runs, loading } = useWorkflow(id || null);
    const activeRunId = searchParams.get('run');
    const { run: activeRun } = useWorkflowRun(activeRunId);

    const [activeTab, setActiveTab] = useState<'editor' | 'runs' | 'logs'>('editor');
    const [saving, setSaving] = useState(false);

    const handleSave = async (updates: Partial<Workflow>) => {
        if (!id) return;
        setSaving(true);
        try {
            await updateWorkflow(id, updates);
            toast.success('Workflow saved');
        } catch (error) {
            toast.error('Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleTrigger = async () => {
        if (!id) return;
        try {
            const runId = await triggerWorkflow(id);
            toast.success('Workflow triggered');
            navigate(`/workflows/${id}?run=${runId}`);
            setActiveTab('runs');
        } catch (error) {
            toast.error('Failed to trigger workflow');
        }
    };

    const handlePause = async () => {
        if (!id) return;
        try {
            await pauseWorkflow(id);
            toast.success('Workflow paused');
        } catch (error) {
            toast.error('Failed to pause workflow');
        }
    };

    const handleResume = async () => {
        if (!id) return;
        try {
            await resumeWorkflow(id);
            toast.success('Workflow resumed');
        } catch (error) {
            toast.error('Failed to resume workflow');
        }
    };

    const getRunStatusIcon = (status: WorkflowRun['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="text-emerald-400" size={16} />;
            case 'failed':
                return <XCircle className="text-red-400" size={16} />;
            case 'running':
                return <RefreshCw className="text-blue-400 animate-spin" size={16} />;
            case 'cancelled':
                return <AlertCircle className="text-dark-400" size={16} />;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-dark-800 rounded"></div>
                    <div className="h-96 bg-dark-800 rounded-xl"></div>
                </div>
            </Layout>
        );
    }

    if (!workflow) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-dark-400">Workflow not found</p>
                </div>
            </Layout>
        );
    }

    const tabs = [
        { id: 'editor', name: 'Editor' },
        { id: 'runs', name: `Runs (${runs.length})` },
        { id: 'logs', name: 'Logs' },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/workflows')}
                        className="p-2 text-dark-400 hover:text-dark-100 rounded-lg hover:bg-dark-800"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-dark-100">{workflow.name}</h1>
                        <p className="text-dark-400 mt-1">{workflow.description}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-dark-800">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-primary-500 text-primary-400'
                                        : 'border-transparent text-dark-400 hover:text-dark-200'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Editor Tab */}
                {activeTab === 'editor' && (
                    <WorkflowEditor
                        workflow={workflow}
                        onSave={handleSave}
                        onTrigger={handleTrigger}
                        onPause={handlePause}
                        onResume={handleResume}
                        saving={saving}
                    />
                )}

                {/* Runs Tab */}
                {activeTab === 'runs' && (
                    <div className="space-y-6">
                        {/* Active Run */}
                        {activeRun && (
                            <div className="card border-primary-500/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {getRunStatusIcon(activeRun.status)}
                                        <h3 className="text-lg font-semibold text-dark-100">
                                            Active Run: {activeRun.id.slice(0, 8)}
                                        </h3>
                                        <span
                                            className={`badge ${activeRun.status === 'completed'
                                                    ? 'badge-success'
                                                    : activeRun.status === 'failed'
                                                        ? 'badge-danger'
                                                        : activeRun.status === 'running'
                                                            ? 'badge-info'
                                                            : 'badge-neutral'
                                                }`}
                                        >
                                            {activeRun.status}
                                        </span>
                                    </div>
                                    {activeRun.status === 'running' && (
                                        <Activity className="text-blue-400 animate-pulse" size={20} />
                                    )}
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-dark-500">Started</p>
                                        <p className="text-sm text-dark-200">
                                            {format(
                                                activeRun.startedAt?.toDate?.() || new Date(activeRun.startedAt as any),
                                                'MMM d, h:mm:ss a'
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Duration</p>
                                        <p className="text-sm text-dark-200">
                                            {activeRun.duration ? `${(activeRun.duration / 1000).toFixed(1)}s` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Doctors Processed</p>
                                        <p className="text-sm text-dark-200">{activeRun.doctorsProcessed}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Success / Failed</p>
                                        <p className="text-sm">
                                            <span className="text-emerald-400">{activeRun.successCount}</span>
                                            {' / '}
                                            <span className="text-red-400">{activeRun.failureCount}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Live Logs */}
                                {activeRun.logs && activeRun.logs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-dark-800">
                                        <h4 className="text-sm font-medium text-dark-400 mb-2">Recent Logs</h4>
                                        <div className="bg-dark-950 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs">
                                            {activeRun.logs.slice(-20).map((log, i) => (
                                                <div key={i} className="flex items-start space-x-2 py-1">
                                                    <span className="text-dark-500">
                                                        {format(
                                                            log.timestamp?.toDate?.() || new Date(log.timestamp as any),
                                                            'HH:mm:ss'
                                                        )}
                                                    </span>
                                                    <span
                                                        className={
                                                            log.level === 'error'
                                                                ? 'text-red-400'
                                                                : log.level === 'warn'
                                                                    ? 'text-yellow-400'
                                                                    : 'text-dark-300'
                                                        }
                                                    >
                                                        {log.message}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {activeRun.errors && activeRun.errors.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-dark-800">
                                        <h4 className="text-sm font-medium text-red-400 mb-2">
                                            Errors ({activeRun.errors.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {activeRun.errors.slice(0, 5).map((error, i) => (
                                                <div key={i} className="p-2 bg-red-500/10 rounded text-sm">
                                                    <p className="text-red-400">{error.message}</p>
                                                    <p className="text-xs text-dark-500 mt-1">
                                                        Doctor: {error.doctorId} | Step: {error.step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Run History */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Run History</h3>
                            {runs.length === 0 ? (
                                <p className="text-dark-400 text-center py-8">No runs yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {runs.map((run) => (
                                        <div
                                            key={run.id}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeRunId === run.id
                                                    ? 'bg-primary-600/20 border border-primary-500/50'
                                                    : 'bg-dark-800 hover:bg-dark-750'
                                                }`}
                                            onClick={() => navigate(`/workflows/${id}?run=${run.id}`)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                {getRunStatusIcon(run.status)}
                                                <div>
                                                    <p className="text-sm font-medium text-dark-200">
                                                        {run.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-xs text-dark-500">
                                                        {format(
                                                            run.startedAt?.toDate?.() || new Date(run.startedAt as any),
                                                            'MMM d, h:mm a'
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <span className="text-dark-400">
                                                    {run.doctorsProcessed} doctors
                                                </span>
                                                <span className="text-emerald-400">{run.successCount} ✓</span>
                                                <span className="text-red-400">{run.failureCount} ✗</span>
                                                <span className="text-dark-500">
                                                    {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Workflow Logs</h3>
                        <LogViewer logs={[]} loading={false} />
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WorkflowDetail;