import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    User,
    Bell,
    Shield,
    CreditCard,
    Globe,
    Calendar,
    MessageCircle,
    Save,
    Trash2,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useDoctor } from '@/hooks/useDoctor';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'automation', name: 'Automation', icon: Globe },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', icon: Calendar },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Shield },
];

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const { doctor, loading, update } = useDoctor();
    const { logout } = useAuth();

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: doctor?.name || '',
            specialty: doctor?.specialty || '',
            phone: doctor?.phone || '',
            address: doctor?.address || '',
            bio: doctor?.bio || '',
        },
    });

    const onSaveProfile = async (data: any) => {
        setSaving(true);
        try {
            await update(data);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const onSaveAutomation = async (data: any) => {
        setSaving(true);
        try {
            await update({
                automationSettings: {
                    ...doctor?.automationSettings,
                    ...data,
                },
            });
            toast.success('Automation settings updated');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleAutomation = async () => {
        try {
            await update({ active: !doctor?.active });
            toast.success(doctor?.active ? 'Automations paused' : 'Automations resumed');
        } catch (error) {
            toast.error('Failed to toggle automations');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account and preferences</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Tabs */}
                    <div className="lg:w-64">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <tab.icon size={18} className="mr-3" />
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
                                <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Full Name</label>
                                            <input
                                                {...register('name')}
                                                type="text"
                                                className="input"
                                                defaultValue={doctor?.name}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Specialty</label>
                                            <input
                                                {...register('specialty')}
                                                type="text"
                                                className="input"
                                                defaultValue={doctor?.specialty}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Phone</label>
                                            <input
                                                {...register('phone')}
                                                type="tel"
                                                className="input"
                                                defaultValue={doctor?.phone}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Address</label>
                                            <input
                                                {...register('address')}
                                                type="text"
                                                className="input"
                                                defaultValue={doctor?.address}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Bio</label>
                                        <textarea
                                            {...register('bio')}
                                            className="input h-32"
                                            defaultValue={doctor?.bio}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" disabled={saving} className="btn-primary">
                                            <Save size={16} className="mr-2" />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Automation Tab */}
                        {activeTab === 'automation' && (
                            <div className="space-y-6">
                                <div className="card">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Automation Status</h2>
                                            <p className="text-sm text-gray-600">
                                                {doctor?.active ? 'All automations are running' : 'Automations are paused'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={toggleAutomation}
                                            className={`px-4 py-2 rounded-lg font-medium ${doctor?.active
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {doctor?.active ? 'Pause All' : 'Resume All'}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">GMB Auto-Posts</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {doctor?.automationSettings?.gmbPostFrequency} at{' '}
                                                        {doctor?.automationSettings?.gmbPostTime}
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        defaultChecked={doctor?.gmbConfig?.autoPostEnabled}
                                                        onChange={async (e) => {
                                                            await update({
                                                                gmbConfig: {
                                                                    ...doctor?.gmbConfig,
                                                                    autoPostEnabled: e.target.checked,
                                                                },
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">GMB Auto-Reply</h3>
                                                    <p className="text-sm text-gray-600">Automatically reply to reviews</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        defaultChecked={doctor?.gmbConfig?.autoReplyEnabled}
                                                        onChange={async (e) => {
                                                            await update({
                                                                gmbConfig: {
                                                                    ...doctor?.gmbConfig,
                                                                    autoReplyEnabled: e.target.checked,
                                                                },
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">WhatsApp Scheduling</h3>
                                                    <p className="text-sm text-gray-600">Allow patients to book via WhatsApp</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        defaultChecked={doctor?.whatsappConfig?.enabled}
                                                        onChange={async (e) => {
                                                            await update({
                                                                whatsappConfig: {
                                                                    ...doctor?.whatsappConfig,
                                                                    enabled: e.target.checked,
                                                                },
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Schedule Settings</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">GMB Post Frequency</label>
                                            <select
                                                className="input"
                                                defaultValue={doctor?.automationSettings?.gmbPostFrequency}
                                                onChange={async (e) => {
                                                    await update({
                                                        automationSettings: {
                                                            ...doctor?.automationSettings,
                                                            gmbPostFrequency: e.target.value as any,
                                                        },
                                                    });
                                                }}
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="biweekly">Bi-weekly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">GMB Post Time</label>
                                            <input
                                                type="time"
                                                className="input"
                                                defaultValue={doctor?.automationSettings?.gmbPostTime}
                                                onChange={async (e) => {
                                                    await update({
                                                        automationSettings: {
                                                            ...doctor?.automationSettings,
                                                            gmbPostTime: e.target.value,
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Reminder Hours Before Appointment</label>
                                            <select
                                                className="input"
                                                defaultValue={doctor?.automationSettings?.reminderHours}
                                                onChange={async (e) => {
                                                    await update({
                                                        automationSettings: {
                                                            ...doctor?.automationSettings,
                                                            reminderHours: parseInt(e.target.value),
                                                        },
                                                    });
                                                }}
                                            >
                                                <option value={1}>1 hour</option>
                                                <option value={2}>2 hours</option>
                                                <option value={6}>6 hours</option>
                                                <option value={12}>12 hours</option>
                                                <option value={24}>24 hours</option>
                                                <option value={48}>48 hours</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Integrations Tab */}
                        {activeTab === 'integrations' && (
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Connected Services</h2>
                                <div className="space-y-4">
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Globe className="text-blue-600" size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Google My Business</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {doctor?.gmbConfig?.connected ? 'Connected' : 'Not connected'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                className={`btn-secondary text-sm ${doctor?.gmbConfig?.connected ? 'text-red-600' : ''
                                                    }`}
                                            >
                                                {doctor?.gmbConfig?.connected ? 'Disconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <Calendar className="text-green-600" size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Google Calendar</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {doctor?.calendarConfig?.connected
                                                            ? `Connected: ${doctor?.calendarConfig?.calendarId}`
                                                            : 'Not connected'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                className={`btn-secondary text-sm ${doctor?.calendarConfig?.connected ? 'text-red-600' : ''
                                                    }`}
                                            >
                                                {doctor?.calendarConfig?.connected ? 'Disconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <MessageCircle className="text-green-500" size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">WhatsApp Business</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {doctor?.whatsappConfig?.enabled
                                                            ? `Active: ${doctor?.whatsappConfig?.phoneNumber}`
                                                            : 'Not configured'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary text-sm">Configure</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Billing Tab */}
                        {activeTab === 'billing' && (
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing & Plan</h2>
                                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-primary-900">
                                                Current Plan: {doctor?.plan?.toUpperCase() || 'FREE'}
                                            </h3>
                                            <p className="text-sm text-primary-700 mt-1">
                                                {doctor?.plan === 'free'
                                                    ? 'Limited to 10 posts/month'
                                                    : 'Unlimited posts and features'}
                                            </p>
                                        </div>
                                        <button className="btn-primary">Upgrade Plan</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium text-gray-900">Free</h4>
                                        <p className="text-2xl font-bold mt-2">$0</p>
                                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                            <li>• 10 posts/month</li>
                                            <li>• Basic analytics</li>
                                            <li>• Email support</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 border-2 border-primary-500 rounded-lg">
                                        <h4 className="font-medium text-gray-900">Pro</h4>
                                        <p className="text-2xl font-bold mt-2">$29/mo</p>
                                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                            <li>• Unlimited posts</li>
                                            <li>• Advanced analytics</li>
                                            <li>• Priority support</li>
                                            <li>• WhatsApp scheduling</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium text-gray-900">Enterprise</h4>
                                        <p className="text-2xl font-bold mt-2">Custom</p>
                                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                            <li>• Everything in Pro</li>
                                            <li>• Custom integrations</li>
                                            <li>• Dedicated support</li>
                                            <li>• SLA guarantee</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="card">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                                    <div className="space-y-4">
                                        <button className="w-full p-4 border rounded-lg text-left hover:bg-gray-50">
                                            <h3 className="font-medium text-gray-900">Change Password</h3>
                                            <p className="text-sm text-gray-600">Update your account password</p>
                                        </button>
                                        <button className="w-full p-4 border rounded-lg text-left hover:bg-gray-50">
                                            <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                                        </button>
                                        <button className="w-full p-4 border rounded-lg text-left hover:bg-gray-50">
                                            <h3 className="font-medium text-gray-900">Active Sessions</h3>
                                            <p className="text-sm text-gray-600">Manage your active sessions</p>
                                        </button>
                                    </div>
                                </div>

                                <div className="card border-red-200">
                                    <h2 className="text-lg font-semibold text-red-600 mb-6">Danger Zone</h2>
                                    <div className="space-y-4">
                                        <button
                                            onClick={logout}
                                            className="w-full p-4 border border-red-200 rounded-lg text-left hover:bg-red-50"
                                        >
                                            <h3 className="font-medium text-red-600">Sign Out</h3>
                                            <p className="text-sm text-red-500">Sign out from your account</p>
                                        </button>
                                        <button className="w-full p-4 border border-red-200 rounded-lg text-left hover:bg-red-50">
                                            <h3 className="font-medium text-red-600 flex items-center">
                                                <Trash2 size={16} className="mr-2" />
                                                Delete Account
                                            </h3>
                                            <p className="text-sm text-red-500">Permanently delete your account and data</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="card">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {[
                                        { id: 'email_posts', label: 'Post notifications', desc: 'Email when posts are published' },
                                        { id: 'email_reviews', label: 'Review notifications', desc: 'Email when new reviews arrive' },
                                        { id: 'email_appointments', label: 'Appointment notifications', desc: 'Email for new appointments' },
                                        { id: 'email_weekly', label: 'Weekly summary', desc: 'Weekly performance report' },
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{item.label}</h3>
                                                <p className="text-sm text-gray-600">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;