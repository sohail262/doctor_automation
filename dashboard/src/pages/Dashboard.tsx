import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    Calendar,
    MessageSquare,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useDoctor } from '@/hooks/useDoctor';
import { useLogs } from '@/hooks/useLogs';
import { subscribeToPosts, subscribeToAppointments } from '@/services/firestore';
import type { Post, Appointment, DashboardStats } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
    const { user } = useAuth();
    const { doctor, loading: doctorLoading } = useDoctor();
    const { logs } = useLogs(10);
    const [posts, setPosts] = useState<Post[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        if (!user) return;

        const unsubPosts = subscribeToPosts(user.uid, setPosts, 5);
        const unsubAppts = subscribeToAppointments(user.uid, setAppointments);

        // Calculate stats
        setStats({
            totalPosts: posts.length,
            postsThisMonth: posts.filter(
                (p) => new Date(p.createdAt).getMonth() === new Date().getMonth()
            ).length,
            totalAppointments: appointments.length,
            appointmentsThisWeek: appointments.filter((a) => {
                const apptDate = new Date(a.appointmentTime);
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return apptDate >= now && apptDate <= weekFromNow;
            }).length,
            totalReviews: 0,
            averageRating: 4.8,
            automationStatus: doctor?.active ? 'active' : 'paused',
        });

        return () => {
            unsubPosts();
            unsubAppts();
        };
    }, [user, posts.length, appointments.length, doctor?.active]);

    if (doctorLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        );
    }

    if (!doctor?.onboarded) {
        return (
            <Layout>
                <div className="card text-center py-12">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-primary-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        You're almost there! Complete the onboarding process to start automating your practice.
                    </p>
                    <Link to="/onboarding" className="btn-primary">
                        Continue Setup <ArrowRight className="ml-2" size={18} />
                    </Link>
                </div>
            </Layout>
        );
    }

    const statCards = [
        {
            name: 'Total Posts',
            value: stats?.totalPosts || 0,
            change: `${stats?.postsThisMonth || 0} this month`,
            icon: FileText,
            color: 'bg-blue-500',
        },
        {
            name: 'Appointments',
            value: stats?.totalAppointments || 0,
            change: `${stats?.appointmentsThisWeek || 0} this week`,
            icon: Calendar,
            color: 'bg-green-500',
        },
        {
            name: 'Reviews',
            value: stats?.totalReviews || 0,
            change: `${stats?.averageRating || 0} avg rating`,
            icon: MessageSquare,
            color: 'bg-yellow-500',
        },
        {
            name: 'Automation',
            value: stats?.automationStatus === 'active' ? 'Active' : 'Paused',
            change: 'All systems running',
            icon: TrendingUp,
            color: stats?.automationStatus === 'active' ? 'bg-emerald-500' : 'bg-red-500',
        },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back, {doctor?.name?.split(' ')[0] || 'Doctor'}!
                        </h1>
                        <p className="text-gray-600 mt-1">Here's what's happening with your practice.</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                        <Link to="/posts" className="btn-secondary">
                            View Posts
                        </Link>
                        <Link to="/settings" className="btn-primary">
                            Settings
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => (
                        <div key={stat.name} className="card">
                            <div className="flex items-center">
                                <div className={`${stat.color} rounded-lg p-3`}>
                                    <stat.icon className="text-white" size={24} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Posts */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
                            <Link to="/posts" className="text-sm text-primary-600 hover:text-primary-500">
                                View all
                            </Link>
                        </div>
                        {posts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="mx-auto mb-2" size={32} />
                                <p>No posts yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.slice(0, 5).map((post) => (
                                    <div key={post.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div
                                            className={`w-2 h-2 mt-2 rounded-full ${post.status === 'posted'
                                                    ? 'bg-green-500'
                                                    : post.status === 'failed'
                                                        ? 'bg-red-500'
                                                        : 'bg-yellow-500'
                                                }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{post.content}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {post.type.toUpperCase()} •{' '}
                                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                            <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-500">
                                View all
                            </Link>
                        </div>
                        {appointments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="mx-auto mb-2" size={32} />
                                <p>No upcoming appointments</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appointments.slice(0, 5).map((appt) => (
                                    <div key={appt.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <Clock className="text-primary-600" size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{appt.patientName}</p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(appt.appointmentTime), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${appt.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : appt.status === 'scheduled'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {appt.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Log */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <Link to="/logs" className="text-sm text-primary-600 hover:text-primary-500">
                            View all
                        </Link>
                    </div>
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="mx-auto mb-2" size={32} />
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start space-x-3">
                                    <div
                                        className={`w-2 h-2 mt-2 rounded-full ${log.type === 'success'
                                                ? 'bg-green-500'
                                                : log.type === 'error'
                                                    ? 'bg-red-500'
                                                    : log.type === 'warning'
                                                        ? 'bg-yellow-500'
                                                        : 'bg-blue-500'
                                            }`}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{log.message}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;