import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
    Users,
    Search,
    Filter,
    Download,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    XCircle,
    Clock,
    Globe,
    MessageCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useDoctors } from '@/hooks/useDoctors';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { DoctorAdmin, DoctorFilters } from '@/types/admin';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Doctors = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAdminAuth();
    const {
        doctors,
        total,
        loading,
        filters,
        pagination,
        totalPages,
        updateFilters,
        updatePagination,
        refresh,
        suspendDoctor,
        unsuspendDoctor,
        deleteDoctor,
        bulkUpdate,
    } = useDoctors();

    const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorAdmin | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const columns = useMemo<ColumnDef<DoctorAdmin>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
                        className="rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={(e) => row.toggleSelected(e.target.checked)}
                        className="rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                    />
                ),
                size: 40,
            },
            {
                accessorKey: 'name',
                header: 'Doctor',
                cell: ({ row }) => (
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-400">
                                {row.original.name?.charAt(0) || 'D'}
                            </span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-dark-100">{row.original.name}</p>
                            <p className="text-xs text-dark-500">{row.original.email}</p>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'specialty',
                header: 'Specialty',
                cell: ({ getValue }) => (
                    <span className="text-dark-300">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const status = getValue() as string;
                    const statusClasses: Record<string, string> = {
                        active: 'badge-success',
                        suspended: 'badge-danger',
                        pending: 'badge-warning',
                        deleted: 'badge-neutral',
                    };
                    return <span className={`badge ${statusClasses[status]}`}>{status}</span>;
                },
            },
            {
                accessorKey: 'plan',
                header: 'Plan',
                cell: ({ getValue }) => {
                    const plan = getValue() as string;
                    const planClasses: Record<string, string> = {
                        free: 'badge-neutral',
                        pro: 'bg-primary-500/20 text-primary-400',
                        enterprise: 'bg-emerald-500/20 text-emerald-400',
                    };
                    return <span className={`badge ${planClasses[plan]}`}>{plan}</span>;
                },
            },
            {
                accessorKey: 'integrations',
                header: 'Integrations',
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <span
                            className={`p-1 rounded ${row.original.gmbConfig?.connected
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-dark-700 text-dark-500'
                                }`}
                            title="Google My Business"
                        >
                            <Globe size={14} />
                        </span>
                        <span
                            className={`p-1 rounded ${row.original.whatsappConfig?.enabled
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-dark-700 text-dark-500'
                                }`}
                            title="WhatsApp"
                        >
                            <MessageCircle size={14} />
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'stats.totalPosts',
                header: 'Posts',
                cell: ({ row }) => (
                    <span className="text-dark-300">{row.original.stats?.totalPosts || 0}</span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Joined',
                cell: ({ getValue }) => {
                    const date = getValue() as any;
                    return (
                        <span className="text-dark-400 text-sm">
                            {format(date?.toDate?.() || new Date(date), 'MMM d, yyyy')}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoctor(row.original);
                            }}
                            className="p-2 text-dark-400 hover:text-dark-100 rounded-lg hover:bg-dark-700"
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>
                ),
                size: 50,
            },
        ],
        []
    );

    const handleSuspend = async () => {
        if (!selectedDoctor) return;
        setActionLoading(true);
        try {
            await suspendDoctor(selectedDoctor.id, suspendReason);
            setSuspendModalOpen(false);
            setSuspendReason('');
            setSelectedDoctor(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDoctor) return;
        setActionLoading(true);
        try {
            await deleteDoctor(selectedDoctor.id);
            setDeleteModalOpen(false);
            setSelectedDoctor(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedDoctors.length === 0) {
            toast.error('No doctors selected');
            return;
        }

        switch (action) {
            case 'activate':
                await bulkUpdate(selectedDoctors, { status: 'active' });
                break;
            case 'suspend':
                await bulkUpdate(selectedDoctors, { status: 'suspended' });
                break;
            case 'upgrade_pro':
                await bulkUpdate(selectedDoctors, { plan: 'pro' });
                break;
        }

        setSelectedDoctors([]);
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">Doctors</h1>
                        <p className="text-dark-400 mt-1">{total} total doctors</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setFilterModalOpen(true)} className="btn-secondary">
                            <Filter size={16} className="mr-2" />
                            Filters
                        </button>
                        <button className="btn-secondary">
                            <Download size={16} className="mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedDoctors.length > 0 && (
                    <div className="flex items-center space-x-3 p-4 bg-primary-600/10 border border-primary-600/20 rounded-lg">
                        <span className="text-sm text-primary-400">
                            {selectedDoctors.length} selected
                        </span>
                        <div className="flex-1" />
                        <button
                            onClick={() => handleBulkAction('activate')}
                            className="btn-ghost btn-sm text-emerald-400"
                        >
                            <CheckCircle size={16} className="mr-1" />
                            Activate
                        </button>
                        <button
                            onClick={() => handleBulkAction('suspend')}
                            className="btn-ghost btn-sm text-yellow-400"
                        >
                            <Ban size={16} className="mr-1" />
                            Suspend
                        </button>
                        <button
                            onClick={() => handleBulkAction('upgrade_pro')}
                            className="btn-ghost btn-sm text-primary-400"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                )}

                {/* Active Filters */}
                {Object.keys(filters).length > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-dark-400">Active filters:</span>
                        {filters.status && (
                            <span className="badge badge-info">
                                Status: {filters.status}
                                <button
                                    onClick={() => updateFilters({ status: undefined })}
                                    className="ml-1"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {filters.plan && (
                            <span className="badge badge-info">
                                Plan: {filters.plan}
                                <button
                                    onClick={() => updateFilters({ plan: undefined })}
                                    className="ml-1"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => updateFilters({})}
                            className="text-sm text-primary-400 hover:text-primary-300"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Table */}
                <DataTable
                    data={doctors}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search doctors..."
                    onRowClick={(doctor) => navigate(`/doctors/${doctor.id}`)}
                />

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-dark-400">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, total)} of {total}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => updatePagination({ page: pagination.page - 1 })}
                            disabled={pagination.page <= 1}
                            className="btn-secondary btn-sm"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-dark-400">
                            Page {pagination.page} of {totalPages}
                        </span>
                        <button
                            onClick={() => updatePagination({ page: pagination.page + 1 })}
                            disabled={pagination.page >= totalPages}
                            className="btn-secondary btn-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Doctor Action Menu */}
                {selectedDoctor && !suspendModalOpen && !deleteModalOpen && (
                    <div className="fixed inset-0 z-50" onClick={() => setSelectedDoctor(null)}>
                        <div
                            className="absolute right-8 top-32 bg-dark-800 rounded-lg shadow-xl border border-dark-700 py-2 w-48"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => navigate(`/doctors/${selectedDoctor.id}`)}
                                className="dropdown-item flex items-center"
                            >
                                <Eye size={16} className="mr-2" />
                                View Details
                            </button>
                            {hasPermission('doctors', 'edit') && (
                                <button
                                    onClick={() => navigate(`/doctors/${selectedDoctor.id}/edit`)}
                                    className="dropdown-item flex items-center"
                                >
                                    <Edit size={16} className="mr-2" />
                                    Edit
                                </button>
                            )}
                            {hasPermission('doctors', 'edit') && selectedDoctor.status === 'active' && (
                                <button
                                    onClick={() => setSuspendModalOpen(true)}
                                    className="dropdown-item flex items-center text-yellow-400"
                                >
                                    <Ban size={16} className="mr-2" />
                                    Suspend
                                </button>
                            )}
                            {hasPermission('doctors', 'edit') && selectedDoctor.status === 'suspended' && (
                                <button
                                    onClick={async () => {
                                        await unsuspendDoctor(selectedDoctor.id);
                                        setSelectedDoctor(null);
                                    }}
                                    className="dropdown-item flex items-center text-emerald-400"
                                >
                                    <CheckCircle size={16} className="mr-2" />
                                    Unsuspend
                                </button>
                            )}
                            {hasPermission('doctors', 'delete') && (
                                <button
                                    onClick={() => setDeleteModalOpen(true)}
                                    className="dropdown-item flex items-center text-red-400"
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter Modal */}
                <Modal
                    isOpen={filterModalOpen}
                    onClose={() => setFilterModalOpen(false)}
                    title="Filter Doctors"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="label">Status</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) =>
                                    updateFilters({ status: e.target.value as any || undefined })
                                }
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Plan</label>
                            <select
                                value={filters.plan || ''}
                                onChange={(e) =>
                                    updateFilters({ plan: e.target.value as any || undefined })
                                }
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Onboarded</label>
                            <select
                                value={filters.onboarded?.toString() || ''}
                                onChange={(e) =>
                                    updateFilters({
                                        onboarded: e.target.value ? e.target.value === 'true' : undefined,
                                    })
                                }
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Has GMB</label>
                            <select
                                value={filters.hasGMB?.toString() || ''}
                                onChange={(e) =>
                                    updateFilters({
                                        hasGMB: e.target.value ? e.target.value === 'true' : undefined,
                                    })
                                }
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="true">Connected</option>
                                <option value="false">Not Connected</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={() => setFilterModalOpen(false)} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={() => setFilterModalOpen(false)}
                            className="btn-primary"
                        >
                            Apply Filters
                        </button>
                    </div>
                </Modal>

                {/* Suspend Modal */}
                <Modal
                    isOpen={suspendModalOpen}
                    onClose={() => {
                        setSuspendModalOpen(false);
                        setSuspendReason('');
                    }}
                    title="Suspend Doctor"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p className="text-dark-300">
                            Are you sure you want to suspend{' '}
                            <span className="font-medium text-dark-100">{selectedDoctor?.name}</span>?
                            This will pause all their automations.
                        </p>
                        <div>
                            <label className="label">Reason for suspension</label>
                            <textarea
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                className="input h-24"
                                placeholder="Enter reason..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setSuspendModalOpen(false);
                                setSuspendReason('');
                            }}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSuspend}
                            disabled={!suspendReason || actionLoading}
                            className="btn bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            {actionLoading ? 'Suspending...' : 'Suspend'}
                        </button>
                    </div>
                </Modal>

                {/* Delete Confirmation */}
                <ConfirmDialog
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Doctor"
                    message={`Are you sure you want to delete ${selectedDoctor?.name}? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="danger"
                    loading={actionLoading}
                />
            </div>
        </Layout>
    );
};

export default Doctors;