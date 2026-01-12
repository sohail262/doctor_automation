import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Workflow as WorkflowIcon,
    Play,
    Pause,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    MoreVertical,
    Plus,
    RefreshCw,
    Zap,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { Workflow } from '@/types/admin';
import { format } from 'date-fns';
import cronstrue from 'cronstrue';
import toast from 'react-hot-toast';

const Workflows = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAdminAuth();
    const {
        workflows,
        loading,
        refresh,
        triggerWorkflow,
        pauseWorkflow,
        resumeWorkflow,
    } = useWorkflows();

    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [triggerModalOpen, setTriggerModalOpen] = useState(false);
    const [triggerOptions, setTriggerOptions] = useState({
        dryRun: false,
        doctorIds: '',
    });
    const [actionLoading, setActionLoading] = useState(false);

    const getStatusIcon = (status: Workflow['status']) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="text-emerald-400" size={18} />;
            case 'paused':
                return <Pause className="text-yellow-400" size={18} />;
            case 'disabled':
                return <XCircle className="text-dark-500" size={18} />;
            case 'error':
                return <AlertTriangle className="text-red-400" size={18} />;
        }
    };

    const getStatusBadge = (status: Workflow['status']) => {
        const classes: Record<string, string> = {
            active: 'badge-success',
            paused: 'badge-warning',
            disabled: 'badge-neutral',
            error: 'badge-danger',
        };
        return <span className={`badge ${classes[status]}`}>{status}</span>;
    };

    const getTypeIcon = (type: Workflow['type']) => {
        const icons: Record<string, JSX.Element> = {
            gmb_post: <span className="text-blue-400">GMB</span>,
            social_post: <span className="text-pink-400">Social</span>,
            review_reply: <span className="text-green-400">Review</span>,
            reminder: <span className="text-yellow-400">Reminder</span>,
            whatsapp: <span className="text-emerald-400">WhatsApp</span>,
            custom: <span className="text-purple-400">Custom</span>,
        };
        return icons[type] || <Zap className="text-dark-400" size={18} />;
    };

    const getCronDescription = (cron?: string) => {
        if (!cron) return 'Manual trigger only';
        try {
            return cronstrue.toString(cron);
        } catch {
            return cron;
        }
    };

    const handleTrigger = async () => {
        if (!selectedWorkflow) return;

        setActionLoading(true);
        try {
            const options: any = { dryRun: triggerOptions.dryRun };
            if (triggerOptions.doctorIds.trim()) {
                options.doctorIds = triggerOptions.doctorIds.split(',').map((id) => id.trim());
            }

            const runId = await triggerWorkflow(selectedWorkflow.id, options);
            setTriggerModalOpen(false);
            setTriggerOptions({ dryRun: false, doctorIds: '' });
            toast.success(`Workflow triggered. Run ID: ${runId}`);
            navigate(`/workflows/${selectedWorkflow.id}?run=${runId}`);
        } catch (error) {
            toast.error('Failed to trigger workflow');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePause = async (workflow: Workflow) => {
        try {
            await pauseWorkflow(workflow.id);
        } catch (error) {
            toast.error('Failed to pause workflow');
        }
    };

    const handleResume = async (workflow: Workflow) => {
        try {
            await resumeWorkflow(workflow.id);
        } catch (error) {
            toast.error('Failed to resume workflow');
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">Workflows</h1>
                        <p className="text-dark-400 mt-1">Manage automated workflows</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={refresh} className="btn-secondary">
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                        </button>
                        {hasPermission('workflows', 'edit') && (
                            <button className="btn-primary">
                                <Plus size={16} className="mr-2" />
                                New Workflow
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="card">
                        <p className="text-sm text-dark-400">Total Workflows</p>
                        <p className="text-2xl font-bold text-dark-100 mt-1">{workflows.length}</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-dark-400">Active</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">
                            {workflows.filter((w) => w.status === 'active').length}
                        </p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-dark-400">Paused</p>
                        <p className="text-2xl font-bold text-yellow-400 mt-1">
                            {workflows.filter((w) => w.status === 'paused').length}
                        </p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-dark-400">Errors</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">
                            {workflows.filter((w) => w.status === 'error').length}
                        </p>
                    </div>
                </div>

                {/* Workflow List */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="card animate-pulse h-24"></div>
                        ))}
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="card text-center py-12">
                        <WorkflowIcon className="mx-auto text-dark-500 mb-4" size={48} />
                        <p className="text-dark-400">No workflows configured</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                className="card-hover"
                                onClick={() => navigate(`/workflows/${workflow.id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
                                            {getTypeIcon(workflow.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-semibold text-dark-100">
                                                    {workflow.name}
                                                </h3>
                                                {getStatusBadge(workflow.status)}
                                            </div>
                                            <p className="text-sm text-dark-400 mt-1">{workflow.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-dark-500">
                                                <span className="flex items-center">
                                                    <Clock size={12} className="mr-1" />
                                                    {getCronDescription(workflow.trigger.schedule)}
                                                </span>
                                                {workflow.lastRunAt && (
                                                    <span>
                                                        Last run:{' '}
                                                        {format(
                                                            workflow.lastRunAt?.toDate?.() ||
                                                            new Date(workflow.lastRunAt as any),
                                                            'MMM d, h:mm a'
                                                        )}
                                                    </span>
                                                )}
                                                <span>
                                                    Success rate:{' '}
                                                    {workflow.stats.totalRuns > 0
                                                        ? (
                                                            (workflow.stats.successfulRuns / workflow.stats.totalRuns) *
                                                            100
                                                        ).toFixed(1)
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Quick Actions */}
                                        {hasPermission('workflows', 'trigger') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedWorkflow(workflow);
                                                    setTriggerModalOpen(true);
                                                }}
                                                className="btn-secondary btn-sm"
                                                title="Run workflow"
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}

                                        {hasPermission('workflows', 'pause') && workflow.status === 'active' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePause(workflow);
                                                }}
                                                className="btn-secondary btn-sm"
                                                title="Pause workflow"
                                            >
                                                <Pause size={16} />
                                            </button>
                                        )}

                                        {hasPermission('workflows', 'pause') && workflow.status === 'paused' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleResume(workflow);
                                                }}
                                                className="btn-success btn-sm"
                                                title="Resume workflow"
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => e.stopPropagation()}
                                            className="btn-ghost btn-sm"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-dark-800">
                                    <div>
                                        <p className="text-xs text-dark-500">Total Runs</p>
                                        <p className="text-sm font-medium text-dark-200">
                                            {workflow.stats.totalRuns}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Successful</p>
                                        <p className="text-sm font-medium text-emerald-400">
                                            {workflow.stats.successfulRuns}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Failed</p>
                                        <p className="text-sm font-medium text-red-400">
                                            {workflow.stats.failedRuns}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Avg Duration</p>
                                        <p className="text-sm font-medium text-dark-200">
                                            {workflow.stats.averageDuration
                                                ? `${(workflow.stats.averageDuration / 1000).toFixed(1)}s`
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-dark-500">Doctors Processed</p>
                                        <p className="text-sm font-medium text-dark-200">
                                            {workflow.stats.doctorsProcessed}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Trigger Modal */}
                <Modal
                    isOpen={triggerModalOpen}
                    onClose={() => {
                        setTriggerModalOpen(false);
                        setTriggerOptions({ dryRun: false, doctorIds: '' });
                    }}
                    title={`Trigger: ${selectedWorkflow?.name}`}
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-dark-300">
                            This will manually trigger the workflow. You can optionally specify doctor
                            IDs or run in dry-run mode.
                        </p>

                        <div>
                            <label className="label">Doctor IDs (optional)</label>
                            <input
                                type="text"
                                value={triggerOptions.doctorIds}
                                onChange={(e) =>
                                    setTriggerOptions((prev) => ({ ...prev, doctorIds: e.target.value }))
                                }
                                className="input"
                                placeholder="doc1, doc2, doc3 (comma-separated)"
                            />
                            <p className="text-xs text-dark-500 mt-1">
                                Leave empty to process all eligible doctors
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="dryRun"
                                checked={triggerOptions.dryRun}
                                onChange={(e) =>
                                    setTriggerOptions((prev) => ({ ...prev, dryRun: e.target.checked }))
                                }
                                className="rounded border-dark-600 bg-dark-800 text-primary-600"
                            />
                            <label htmlFor="dryRun" className="text-sm text-dark-300">
                                Dry run (simulate without making changes)
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setTriggerModalOpen(false);
                                setTriggerOptions({ dryRun: false, doctorIds: '' });
                            }}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTrigger}
                            disabled={actionLoading}
                            className="btn-primary"
                        >
                            <Play size={16} className="mr-2" />
                            {actionLoading ? 'Triggering...' : 'Trigger Workflow'}
                        </button>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
};

export default Workflows;