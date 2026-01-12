import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Ban,
    CheckCircle,
    Trash2,
    Globe,
    Calendar,
    MessageCircle,
    FileText,
    Activity,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    Plus,
    Send,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LogViewer from '@/components/LogViewer';
import { SimpleLineChart } from '@/components/Charts';
import { useDoctor } from '@/hooks/useDoctors';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
    addDoctorNote,
    updateDoctorTags,
    suspendDoctor,
    unsuspendDoctor,
} from '@/services/admin-api';
import type { DoctorAdmin, AdminNote, SystemLog } from '@/types/admin';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasPermission, adminUser } = useAdminAuth();
    const { doctor, loading, update } = useDoctor(id || null);

    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings' | 'logs'>('overview');
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Mock activity data
    const activityData = [
        { date: 'Mon', posts: 3, appointments: 5 },
        { date: 'Tue', posts: 2, appointments: 4 },
        { date: 'Wed', posts: 4, appointments: 6 },
        { date: 'Thu', posts: 3, appointments: 3 },
        { date: 'Fri', posts: 5, appointments: 7 },
        { date: 'Sat', posts: 1, appointments: 2 },
        { date: 'Sun', posts: 0, appointments: 0 },
    ];

    // Mock logs
    const logs: SystemLog[] = [];

    if (loading) {
        return (
            <Layout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-dark-800 rounded"></div>
                    <div className="h-64 bg-dark-800 rounded-xl"></div>
                </div>
            </Layout>
        );
    }

    if (!doctor) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-dark-400">Doctor not found</p>
                    <Link to="/doctors" className="text-primary-400 mt-4 inline-block">
                        ← Back to Doctors
                    </Link>
                </div>
            </Layout>
        );
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !id || !adminUser) return;

        setActionLoading(true);
        try {
            await addDoctorNote(id, {
                adminId: adminUser.uid,
                adminName: adminUser.displayName,
                content: newNote,
            });
            setNewNote('');
            setNoteModalOpen(false);
            toast.success('Note added');
        } catch (error) {
            toast.error('Failed to add note');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddTag = async () => {
        if (!tagInput.trim() || !id) return;

        const newTags = [...(doctor.tags || []), tagInput.trim()];
        try {
            await updateDoctorTags(id, newTags);
            setTagInput('');
            toast.success('Tag added');
        } catch (error) {
            toast.error('Failed to add tag');
        }
    };

    const handleRemoveTag = async (tag: string) => {
        if (!id) return;

        const newTags = (doctor.tags || []).filter((t) => t !== tag);
        try {
            await updateDoctorTags(id, newTags);
            toast.success('Tag removed');
        } catch (error) {
            toast.error('Failed to remove tag');
        }
    };

    const handleSuspend = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await suspendDoctor(id, suspendReason);
            setSuspendModalOpen(false);
            setSuspendReason('');
            toast.success('Doctor suspended');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsuspend = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await unsuspendDoctor(id);
            toast.success('Doctor unsuspended');
        } finally {
            setActionLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: User },
        { id: 'activity', name: 'Activity', icon: Activity },
        { id: 'settings', name: 'Settings', icon: Settings },
        { id: 'logs', name: 'Logs', icon: FileText },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/doctors')}
                            className="p-2 text-dark-400 hover:text-dark-100 rounded-lg hover:bg-dark-800"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold text-dark-100">{doctor.name}</h1>
                                <span
                                    className={`badge ${doctor.status === 'active'
                                            ? 'badge-success'
                                            : doctor.status === 'suspended'
                                                ? 'badge-danger'
                                                : 'badge-warning'
                                        }`}
                                >
                                    {doctor.status}
                                </span>
                                <span
                                    className={`badge ${doctor.plan === 'pro'
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : doctor.plan === 'enterprise'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'badge-neutral'
                                        }`}
                                >
                                    {doctor.plan}
                                </span>
                            </div>
                            <p className="text-dark-400 mt-1">{doctor.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {hasPermission('doctors', 'edit') && doctor.status === 'active' && (
                            <button onClick={() => setSuspendModalOpen(true)} className="btn-secondary">
                                <Ban size={16} className="mr-2" />
                                Suspend
                            </button>
                        )}
                        {hasPermission('doctors', 'edit') && doctor.status === 'suspended' && (
                            <button onClick={handleUnsuspend} className="btn-success">
                                <CheckCircle size={16} className="mr-2" />
                                Unsuspend
                            </button>
                        )}
                        {hasPermission('doctors', 'edit') && (
                            <button
                                onClick={() => navigate(`/doctors/${id}/edit`)}
                                className="btn-primary"
                            >
                                <Edit size={16} className="mr-2" />
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-dark-800">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-primary-500 text-primary-400'
                                        : 'border-transparent text-dark-400 hover:text-dark-200'
                                    }`}
                            >
                                <tab.icon size={18} className="mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile Card */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-dark-100 mb-4">Profile Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-3">
                                        <Mail className="text-dark-500" size={18} />
                                        <div>
                                            <p className="text-xs text-dark-500">Email</p>
                                            <p className="text-dark-200">{doctor.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Phone className="text-dark-500" size={18} />
                                        <div>
                                            <p className="text-xs text-dark-500">Phone</p>
                                            <p className="text-dark-200">{doctor.phone || 'Not set'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <User className="text-dark-500" size={18} />
                                        <div>
                                            <p className="text-xs text-dark-500">Specialty</p>
                                            <p className="text-dark-200">{doctor.specialty || 'Not set'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="text-dark-500" size={18} />
                                        <div>
                                            <p className="text-xs text-dark-500">Address</p>
                                            <p className="text-dark-200">{doctor.address || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                                {doctor.bio && (
                                    <div className="mt-4 pt-4 border-t border-dark-800">
                                        <p className="text-xs text-dark-500 mb-1">Bio</p>
                                        <p className="text-dark-300 text-sm">{doctor.bio}</p>
                                    </div>
                                )}
                            </div>

                            {/* Integrations */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-dark-100 mb-4">Integrations</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                                        <div className="flex items-center">
                                            <Globe className="text-blue-400 mr-3" size={20} />
                                            <div>
                                                <p className="text-dark-200">Google My Business</p>
                                                <p className="text-xs text-dark-500">
                                                    {doctor.gmbConfig?.connected
                                                        ? `Connected: ${doctor.gmbConfig.locationId}`
                                                        : 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`badge ${doctor.gmbConfig?.connected ? 'badge-success' : 'badge-neutral'
                                                }`}
                                        >
                                            {doctor.gmbConfig?.connected ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                                        <div className="flex items-center">
                                            <Calendar className="text-green-400 mr-3" size={20} />
                                            <div>
                                                <p className="text-dark-200">Google Calendar</p>
                                                <p className="text-xs text-dark-500">
                                                    {doctor.calendarConfig?.connected
                                                        ? `Connected: ${doctor.calendarConfig.calendarId}`
                                                        : 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`badge ${doctor.calendarConfig?.connected ? 'badge-success' : 'badge-neutral'
                                                }`}
                                        >
                                            {doctor.calendarConfig?.connected ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                                        <div className="flex items-center">
                                            <MessageCircle className="text-emerald-400 mr-3" size={20} />
                                            <div>
                                                <p className="text-dark-200">WhatsApp</p>
                                                <p className="text-xs text-dark-500">
                                                    {doctor.whatsappConfig?.enabled
                                                        ? `Enabled: ${doctor.whatsappConfig.phoneNumber}`
                                                        : 'Not enabled'}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`badge ${doctor.whatsappConfig?.enabled ? 'badge-success' : 'badge-neutral'
                                                }`}
                                        >
                                            {doctor.whatsappConfig?.enabled ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-dark-100 mb-4">Statistics</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-dark-800 rounded-lg">
                                        <p className="text-2xl font-bold text-dark-100">
                                            {doctor.stats?.totalPosts || 0}
                                        </p>
                                        <p className="text-xs text-dark-500">Total Posts</p>
                                    </div>
                                    <div className="text-center p-4 bg-dark-800 rounded-lg">
                                        <p className="text-2xl font-bold text-dark-100">
                                            {doctor.stats?.totalAppointments || 0}
                                        </p>
                                        <p className="text-xs text-dark-500">Appointments</p>
                                    </div>
                                    <div className="text-center p-4 bg-dark-800 rounded-lg">
                                        <p className="text-2xl font-bold text-dark-100">
                                            {doctor.stats?.totalReviews || 0}
                                        </p>
                                        <p className="text-xs text-dark-500">Reviews</p>
                                    </div>
                                    <div className="text-center p-4 bg-dark-800 rounded-lg">
                                        <p className="text-2xl font-bold text-dark-100">
                                            {doctor.stats?.automationSuccessRate?.toFixed(1) || 0}%
                                        </p>
                                        <p className="text-xs text-dark-500">Success Rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Info */}
                            <div className="card">
                                <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
                                    Quick Info
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-dark-500">Joined</span>
                                        <span className="text-dark-200">
                                            {format(
                                                doctor.createdAt?.toDate?.() || new Date(doctor.createdAt as any),
                                                'MMM d, yyyy'
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark-500">Onboarded</span>
                                        <span className="text-dark-200">{doctor.onboarded ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark-500">Active</span>
                                        <span className="text-dark-200">{doctor.active ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark-500">Last Activity</span>
                                        <span className="text-dark-200">
                                            {doctor.lastActivityAt
                                                ? format(
                                                    doctor.lastActivityAt?.toDate?.() ||
                                                    new Date(doctor.lastActivityAt as any),
                                                    'MMM d, h:mm a'
                                                )
                                                : 'Never'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="card">
                                <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {doctor.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="badge badge-info cursor-pointer"
                                            onClick={() => handleRemoveTag(tag)}
                                        >
                                            {tag} ×
                                        </span>
                                    ))}
                                    {(!doctor.tags || doctor.tags.length === 0) && (
                                        <span className="text-dark-500 text-sm">No tags</span>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="Add tag..."
                                        className="input flex-1"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                    />
                                    <button onClick={handleAddTag} className="btn-secondary btn-sm">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">
                                        Admin Notes
                                    </h3>
                                    <button
                                        onClick={() => setNoteModalOpen(true)}
                                        className="btn-ghost btn-sm"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {doctor.notes?.map((note) => (
                                        <div key={note.id} className="p-3 bg-dark-800 rounded-lg">
                                            <p className="text-sm text-dark-200">{note.content}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-dark-500">{note.adminName}</span>
                                                <span className="text-xs text-dark-500">
                                                    {format(
                                                        note.createdAt?.toDate?.() || new Date(note.createdAt as any),
                                                        'MMM d, h:mm a'
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!doctor.notes || doctor.notes.length === 0) && (
                                        <p className="text-dark-500 text-sm">No notes yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Weekly Activity</h3>
                            <SimpleLineChart
                                data={activityData}
                                dataKey="posts"
                                xAxisKey="date"
                                color="#a855f7"
                                height={300}
                            />
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Automation Settings</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="label">GMB Post Frequency</label>
                                    <p className="text-dark-200">
                                        {doctor.automationSettings?.gmbPostFrequency || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <label className="label">GMB Post Time</label>
                                    <p className="text-dark-200">
                                        {doctor.automationSettings?.gmbPostTime || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <label className="label">Social Post Frequency</label>
                                    <p className="text-dark-200">
                                        {doctor.automationSettings?.socialPostFrequency || 'Not set'}
                                    </p>
                                </div>
                                <div>
                                    <label className="label">Reminder Hours</label>
                                    <p className="text-dark-200">
                                        {doctor.automationSettings?.reminderHours || 24} hours before
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {doctor.topics?.map((topic, i) => (
                                    <span key={i} className="badge badge-neutral">
                                        {topic}
                                    </span>
                                ))}
                                {(!doctor.topics || doctor.topics.length === 0) && (
                                    <p className="text-dark-500">No topics configured</p>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-semibold text-dark-100 mb-4">Knowledge Base</h3>
                            <div className="space-y-2">
                                {doctor.knowledgeBase?.map((kb, i) => (
                                    <p key={i} className="text-dark-300 text-sm p-2 bg-dark-800 rounded">
                                        {kb}
                                    </p>
                                ))}
                                {(!doctor.knowledgeBase || doctor.knowledgeBase.length === 0) && (
                                    <p className="text-dark-500">No knowledge base entries</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Activity Logs</h3>
                        <LogViewer logs={logs} />
                    </div>
                )}

                {/* Note Modal */}
                <Modal
                    isOpen={noteModalOpen}
                    onClose={() => {
                        setNoteModalOpen(false);
                        setNewNote('');
                    }}
                    title="Add Note"
                    size="sm"
                >
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter your note..."
                        className="input h-32"
                    />
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={() => {
                                setNoteModalOpen(false);
                                setNewNote('');
                            }}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || actionLoading}
                            className="btn-primary"
                        >
                            {actionLoading ? 'Adding...' : 'Add Note'}
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
                    <p className="text-dark-300 mb-4">
                        Are you sure you want to suspend{' '}
                        <span className="font-medium text-dark-100">{doctor.name}</span>?
                    </p>
                    <div>
                        <label className="label">Reason</label>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            className="input h-24"
                            placeholder="Enter reason for suspension..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
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
            </div>
        </Layout>
    );
};

export default DoctorDetail;