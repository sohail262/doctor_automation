import { useState } from 'react';
import {
    Play,
    Pause,
    Save,
    Clock,
    Zap,
    Globe,
    Database,
    MessageSquare,
    Image,
    Mail,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    GripVertical,
} from 'lucide-react';
import type { Workflow, WorkflowStep, WorkflowTrigger } from '@/types/admin';
import cronstrue from 'cronstrue';

interface WorkflowEditorProps {
    workflow: Workflow;
    onSave: (updates: Partial<Workflow>) => Promise<void>;
    onTrigger: () => Promise<void>;
    onPause: () => Promise<void>;
    onResume: () => Promise<void>;
    saving?: boolean;
}

const WorkflowEditor = ({
    workflow,
    onSave,
    onTrigger,
    onPause,
    onResume,
    saving = false,
}: WorkflowEditorProps) => {
    const [editedWorkflow, setEditedWorkflow] = useState<Workflow>(workflow);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);

    const updateWorkflow = (updates: Partial<Workflow>) => {
        setEditedWorkflow((prev) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const updateTrigger = (updates: Partial<WorkflowTrigger>) => {
        updateWorkflow({ trigger: { ...editedWorkflow.trigger, ...updates } });
    };

    const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
        const steps = editedWorkflow.steps.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
        );
        updateWorkflow({ steps });
    };

    const addStep = () => {
        const newStep: WorkflowStep = {
            id: crypto.randomUUID(),
            name: 'New Step',
            type: 'query',
            config: {},
            onError: 'continue',
        };
        updateWorkflow({ steps: [...editedWorkflow.steps, newStep] });
    };

    const removeStep = (stepId: string) => {
        updateWorkflow({ steps: editedWorkflow.steps.filter((s) => s.id !== stepId) });
    };

    const toggleStepExpand = (stepId: string) => {
        setExpandedSteps((prev) => {
            const next = new Set(prev);
            if (next.has(stepId)) next.delete(stepId);
            else next.add(stepId);
            return next;
        });
    };

    const getStepIcon = (type: WorkflowStep['type']) => {
        const icons = {
            query: <Database size={18} />,
            generate: <MessageSquare size={18} />,
            api_call: <Globe size={18} />,
            condition: <Zap size={18} />,
            transform: <Zap size={18} />,
            notify: <Mail size={18} />,
        };
        return icons[type] || <Zap size={18} />;
    };

    const handleSave = async () => {
        await onSave(editedWorkflow);
        setHasChanges(false);
    };

    const getCronDescription = (cron: string) => {
        try {
            return cronstrue.toString(cron);
        } catch {
            return 'Invalid cron expression';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <input
                        type="text"
                        value={editedWorkflow.name}
                        onChange={(e) => updateWorkflow({ name: e.target.value })}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-dark-100"
                    />
                    <textarea
                        value={editedWorkflow.description}
                        onChange={(e) => updateWorkflow({ description: e.target.value })}
                        placeholder="Add description..."
                        className="block w-full mt-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-dark-400 resize-none"
                        rows={1}
                    />
                </div>

                <div className="flex items-center space-x-3">
                    {/* Status Badge */}
                    <span
                        className={`badge ${editedWorkflow.status === 'active'
                                ? 'badge-success'
                                : editedWorkflow.status === 'paused'
                                    ? 'badge-warning'
                                    : 'badge-danger'
                            }`}
                    >
                        {editedWorkflow.status}
                    </span>

                    {/* Action Buttons */}
                    {editedWorkflow.status === 'active' ? (
                        <button onClick={onPause} className="btn-secondary btn-sm">
                            <Pause size={16} className="mr-1" />
                            Pause
                        </button>
                    ) : (
                        <button onClick={onResume} className="btn-secondary btn-sm">
                            <Play size={16} className="mr-1" />
                            Resume
                        </button>
                    )}

                    <button onClick={onTrigger} className="btn-secondary btn-sm">
                        <Play size={16} className="mr-1" />
                        Run Now
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="btn-primary btn-sm"
                    >
                        <Save size={16} className="mr-1" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Trigger Section */}
            <div className="card">
                <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center">
                    <Clock size={18} className="mr-2 text-primary-400" />
                    Trigger
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Type</label>
                        <select
                            value={editedWorkflow.trigger.type}
                            onChange={(e) => updateTrigger({ type: e.target.value as any })}
                            className="input"
                        >
                            <option value="cron">Scheduled (Cron)</option>
                            <option value="event">Firestore Event</option>
                            <option value="webhook">Webhook</option>
                            <option value="manual">Manual Only</option>
                        </select>
                    </div>

                    {editedWorkflow.trigger.type === 'cron' && (
                        <div>
                            <label className="label">Schedule (Cron)</label>
                            <input
                                type="text"
                                value={editedWorkflow.trigger.schedule || ''}
                                onChange={(e) => updateTrigger({ schedule: e.target.value })}
                                className="input"
                                placeholder="0 9 * * *"
                            />
                            <p className="text-xs text-dark-500 mt-1">
                                {editedWorkflow.trigger.schedule &&
                                    getCronDescription(editedWorkflow.trigger.schedule)}
                            </p>
                        </div>
                    )}

                    {editedWorkflow.trigger.type === 'event' && (
                        <div>
                            <label className="label">Event</label>
                            <input
                                type="text"
                                value={editedWorkflow.trigger.event || ''}
                                onChange={(e) => updateTrigger({ event: e.target.value })}
                                className="input"
                                placeholder="doctors/{doctorId}"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Steps Section */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-dark-100 flex items-center">
                        <Zap size={18} className="mr-2 text-primary-400" />
                        Steps ({editedWorkflow.steps.length})
                    </h3>
                    <button onClick={addStep} className="btn-ghost btn-sm">
                        <Plus size={16} className="mr-1" />
                        Add Step
                    </button>
                </div>

                <div className="space-y-3">
                    {editedWorkflow.steps.map((step, index) => {
                        const isExpanded = expandedSteps.has(step.id);

                        return (
                            <div
                                key={step.id}
                                className="border border-dark-700 rounded-lg overflow-hidden"
                            >
                                {/* Step Header */}
                                <div
                                    className="flex items-center px-4 py-3 bg-dark-800 cursor-pointer hover:bg-dark-750"
                                    onClick={() => toggleStepExpand(step.id)}
                                >
                                    <GripVertical size={16} className="text-dark-500 mr-2 cursor-grab" />
                                    <span className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-400 mr-3">
                                        {index + 1}
                                    </span>
                                    <div className="mr-3 text-dark-400">{getStepIcon(step.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-dark-100">{step.name}</p>
                                        <p className="text-xs text-dark-500">{step.type}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span
                                            className={`badge ${step.onError === 'stop'
                                                    ? 'badge-danger'
                                                    : step.onError === 'retry'
                                                        ? 'badge-warning'
                                                        : 'badge-neutral'
                                                }`}
                                        >
                                            On Error: {step.onError}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeStep(step.id);
                                            }}
                                            className="p-1 text-dark-400 hover:text-red-400"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        {isExpanded ? (
                                            <ChevronUp size={16} className="text-dark-400" />
                                        ) : (
                                            <ChevronDown size={16} className="text-dark-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Step Config (Expanded) */}
                                {isExpanded && (
                                    <div className="px-4 py-4 border-t border-dark-700 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Step Name</label>
                                                <input
                                                    type="text"
                                                    value={step.name}
                                                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Type</label>
                                                <select
                                                    value={step.type}
                                                    onChange={(e) =>
                                                        updateStep(step.id, { type: e.target.value as any })
                                                    }
                                                    className="input"
                                                >
                                                    <option value="query">Database Query</option>
                                                    <option value="generate">Generate Content (LLM)</option>
                                                    <option value="api_call">API Call</option>
                                                    <option value="condition">Condition</option>
                                                    <option value="transform">Transform Data</option>
                                                    <option value="notify">Send Notification</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label">On Error</label>
                                                <select
                                                    value={step.onError}
                                                    onChange={(e) =>
                                                        updateStep(step.id, { onError: e.target.value as any })
                                                    }
                                                    className="input"
                                                >
                                                    <option value="continue">Continue</option>
                                                    <option value="stop">Stop Workflow</option>
                                                    <option value="retry">Retry</option>
                                                </select>
                                            </div>
                                            {step.onError === 'retry' && (
                                                <div>
                                                    <label className="label">Retry Count</label>
                                                    <input
                                                        type="number"
                                                        value={step.retryCount || 3}
                                                        onChange={(e) =>
                                                            updateStep(step.id, { retryCount: parseInt(e.target.value) })
                                                        }
                                                        className="input"
                                                        min={1}
                                                        max={10}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Config JSON Editor */}
                                        <div>
                                            <label className="label">Configuration (JSON)</label>
                                            <textarea
                                                value={JSON.stringify(step.config, null, 2)}
                                                onChange={(e) => {
                                                    try {
                                                        const config = JSON.parse(e.target.value);
                                                        updateStep(step.id, { config });
                                                    } catch { }
                                                }}
                                                className="input font-mono text-xs h-32"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Config Section */}
            <div className="card">
                <h3 className="text-sm font-semibold text-dark-100 mb-4">Advanced Configuration</h3>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="label">Batch Size</label>
                        <input
                            type="number"
                            value={editedWorkflow.config.batchSize}
                            onChange={(e) =>
                                updateWorkflow({
                                    config: {
                                        ...editedWorkflow.config,
                                        batchSize: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="input"
                            min={1}
                            max={500}
                        />
                    </div>
                    <div>
                        <label className="label">Timeout (seconds)</label>
                        <input
                            type="number"
                            value={editedWorkflow.config.timeout}
                            onChange={(e) =>
                                updateWorkflow({
                                    config: {
                                        ...editedWorkflow.config,
                                        timeout: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="input"
                            min={30}
                            max={540}
                        />
                    </div>
                    <div>
                        <label className="label">Max Retries</label>
                        <input
                            type="number"
                            value={editedWorkflow.config.retryPolicy.maxRetries}
                            onChange={(e) =>
                                updateWorkflow({
                                    config: {
                                        ...editedWorkflow.config,
                                        retryPolicy: {
                                            ...editedWorkflow.config.retryPolicy,
                                            maxRetries: parseInt(e.target.value),
                                        },
                                    },
                                })
                            }
                            className="input"
                            min={0}
                            max={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowEditor;