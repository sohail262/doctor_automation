import { useState } from 'react';
import {
    Key,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Copy,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAPIKeys } from '@/hooks/useSystemHealth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { updateAPIKey } from '@/services/admin-api';
import type { APIKey } from '@/types/admin';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const APIKeys = () => {
    const { hasPermission } = useAdminAuth();
    const { keys, loading, testing, test, refresh } = useAPIKeys();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
    const [editForm, setEditForm] = useState({ name: '', usageLimit: 0 });

    const handleEdit = (key: APIKey) => {
        setSelectedKey(key);
        setEditForm({ name: key.name, usageLimit: key.usageLimit || 0 });
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedKey) return;
        try {
            await updateAPIKey(selectedKey.id, {
                name: editForm.name,
                usageLimit: editForm.usageLimit || undefined,
            });
            setEditModalOpen(false);
            refresh();
            toast.success('API key updated');
        } catch (error) {
            toast.error('Failed to update API key');
        }
    };

    const handleRevoke = async () => {
        if (!selectedKey) return;
        try {
            await updateAPIKey(selectedKey.id, { status: 'revoked' });
            setDeleteModalOpen(false);
            refresh();
            toast.success('API key revoked');
        } catch (error) {
            toast.error('Failed to revoke API key');
        }
    };

    const copyKey = (preview: string) => {
        navigator.clipboard.writeText(preview);
        toast.success('Key preview copied');
    };

    const getServiceColor = (service: string) => {
        const colors: Record<string, string> = {
            openai: 'bg-emerald-500/20 text-emerald-400',
            replicate: 'bg-pink-500/20 text-pink-400',
            twilio: 'bg-red-500/20 text-red-400',
            google: 'bg-blue-500/20 text-blue-400',
            meta: 'bg-blue-600/20 text-blue-400',
        };
        return colors[service] || 'bg-dark-600 text-dark-300';
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">API Keys</h1>
                        <p className="text-dark-400 mt-1">Manage third-party API integrations</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={refresh} className="btn-secondary">
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                        </button>
                        {hasPermission('settings', 'edit') && (
                            <button className="btn-primary">
                                <Plus size={16} className="mr-2" />
                                Add Key
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Banner */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                        <strong>Note:</strong> API keys are stored securely in Google Secret Manager.
                        Only key previews (first/last 4 characters) are shown here for security.
                    </p>
                </div>

                {/* Keys List */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card animate-pulse h-24"></div>
                        ))}
                    </div>
                ) : keys.length === 0 ? (
                    <div className="card text-center py-12">
                        <Key className="mx-auto text-dark-500 mb-4" size={48} />
                        <p className="text-dark-400">No API keys configured</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {keys.map((key) => (
                            <div key={key.id} className="card">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${getServiceColor(
                                                key.service
                                            )}`}
                                        >
                                            <Key size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-semibold text-dark-100">{key.name}</h3>
                                                <span className={`badge ${getServiceColor(key.service)}`}>
                                                    {key.service}
                                                </span>
                                                <span
                                                    className={`badge ${key.status === 'active'
                                                            ? 'badge-success'
                                                            : key.status === 'expired'
                                                                ? 'badge-danger'
                                                                : 'badge-warning'
                                                        }`}
                                                >
                                                    {key.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-1 text-sm text-dark-400">
                                                <span className="flex items-center font-mono">
                                                    {key.keyPreview}
                                                    <button
                                                        onClick={() => copyKey(key.keyPreview)}
                                                        className="ml-2 text-dark-500 hover:text-dark-300"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </span>
                                                <span>
                                                    Created:{' '}
                                                    {format(
                                                        key.createdAt?.toDate?.() || new Date(key.createdAt as any),
                                                        'MMM d, yyyy'
                                                    )}
                                                </span>
                                                {key.lastUsedAt && (
                                                    <span>
                                                        Last used:{' '}
                                                        {format(
                                                            key.lastUsedAt?.toDate?.() || new Date(key.lastUsedAt as any),
                                                            'MMM d, h:mm a'
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {/* Usage */}
                                        <div className="text-right">
                                            <p className="text-sm text-dark-400">Usage</p>
                                            <p className="font-semibold text-dark-100">
                                                {key.usageCount.toLocaleString()}
                                                {key.usageLimit && (
                                                    <span className="text-dark-500">
                                                        {' '}
                                                        / {key.usageLimit.toLocaleString()}
                                                    </span>
                                                )}
                                            </p>
                                            {key.usageLimit && (
                                                <div className="w-24 h-1.5 bg-dark-700 rounded-full mt-1">
                                                    <div
                                                        className={`h-full rounded-full ${key.usageCount / key.usageLimit > 0.9
                                                                ? 'bg-red-500'
                                                                : key.usageCount / key.usageLimit > 0.7
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-emerald-500'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                (key.usageCount / key.usageLimit) * 100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => test(key.service)}
                                                disabled={testing === key.service}
                                                className="btn-secondary btn-sm"
                                                title="Test API connection"
                                            >
                                                {testing === key.service ? (
                                                    <RefreshCw size={16} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle size={16} />
                                                )}
                                            </button>
                                            {hasPermission('settings', 'edit') && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(key)}
                                                        className="btn-secondary btn-sm"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedKey(key);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="btn-ghost btn-sm text-red-400 hover:text-red-300"
                                                        title="Revoke"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    title={`Edit: ${selectedKey?.name}`}
                    size="sm"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="label">Display Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Usage Limit (Optional)</label>
                            <input
                                type="number"
                                value={editForm.usageLimit || ''}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        usageLimit: parseInt(e.target.value) || 0,
                                    }))
                                }
                                className="input"
                                placeholder="No limit"
                                min={0}
                            />
                            <p className="text-xs text-dark-500 mt-1">
                                Set to 0 for unlimited usage
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={() => setEditModalOpen(false)} className="btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSaveEdit} className="btn-primary">
                            Save Changes
                        </button>
                    </div>
                </Modal>

                {/* Revoke Confirmation */}
                <ConfirmDialog
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleRevoke}
                    title="Revoke API Key"
                    message={`Are you sure you want to revoke "${selectedKey?.name}"? This will immediately disable all API calls using this key.`}
                    confirmText="Revoke"
                    variant="danger"
                />
            </div>
        </Layout>
    );
};

export default APIKeys;