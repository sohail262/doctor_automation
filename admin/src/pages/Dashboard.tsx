import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    FileText,
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Activity,
    ArrowRight,
    Zap,
    DollarSign,
    MessageSquare,
} from 'lucide-react';
import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import { SimpleAreaChart, SimpleBarChart, SimplePieChart } from '@/components/Charts';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
    getAnalyticsOverview,
    getDoctorGrowthData,
    getPostsData,
    getPlanDistribution,
} from '@/services/analytics';
import { getSystemHealth } from '@/services/admin-api';
import type { AnalyticsOverview, TimeSeriesData, SystemHealth } from '@/types/admin';
import { format } from 'date-fns';

const Dashboard = () => {
    const { adminUser } = useAdminAuth();
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [doctorGrowth, setDoctorGrowth] = useState<TimeSeriesData[]>([]);
    const [postsData, setPostsData] = useState<TimeSeriesData[]>([]);
    const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overviewData, healthData, growthData, posts, plans] = await Promise.all([
                    getAnalyticsOverview(),
                    getSystemHealth(),
                    getDoctorGrowthData(30),
                    getPostsData(30),
                    getPlanDistribution(),
                ]);

                setOverview(overviewData);
                setSystemHealth(healthData);
                setDoctorGrowth(growthData);
                setPostsData(posts);
                setPlanDistribution([
                    { name: 'Free', value: plans.free },
                    { name: 'Pro', value: plans.pro },
                    { name: 'Enterprise', value: plans.enterprise },
                ]);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getHealthStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-emerald-400';
            case 'degraded':
                return 'text-yellow-400';
            case 'down':
                return 'text-red-400';
            default:
                return 'text-dark-400';
        }
    };

    const getHealthStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="text-emerald-400" size={16} />;
            case 'degraded':
                return <AlertCircle className="text-yellow-400" size={16} />;
            case 'down':
                return <AlertCircle className="text-red-400" size={16} />;
            default:
                return <Clock className="text-dark-400" size={16} />;
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">Dashboard</h1>
                        <p className="text-dark-400 mt-1">
                            Welcome back, {adminUser?.displayName || 'Admin'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-dark-500">
                            Last updated: {format(new Date(), 'MMM d, h:mm a')}
                        </span>
                    </div>
                </div>

                {/* System Health Banner */}
                {systemHealth && systemHealth.status !== 'healthy' && (
                    <div
                        className={`p-4 rounded-lg border ${systemHealth.status === 'degraded'
                                ? 'bg-yellow-500/10 border-yellow-500/20'
                                : 'bg-red-500/10 border-red-500/20'
                            }`}
                    >
                        <div className="flex items-center">
                            <AlertCircle
                                className={
                                    systemHealth.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                                }
                                size={20}
                            />
                            <span className="ml-2 font-medium text-dark-100">
                                System {systemHealth.status === 'degraded' ? 'Degraded' : 'Down'}
                            </span>
                            <Link to="/system" className="ml-auto text-sm text-primary-400 hover:text-primary-300">
                                View Details →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Doctors"
                        value={overview?.totalDoctors?.toLocaleString() || '0'}
                        change={12}
                        icon={<Users className="text-primary-400" size={24} />}
                        iconBg="bg-primary-600/20"
                        loading={loading}
                    />
                    <StatsCard
                        title="Active Doctors"
                        value={overview?.activeDoctors?.toLocaleString() || '0'}
                        change={8}
                        icon={<Activity className="text-emerald-400" size={24} />}
                        iconBg="bg-emerald-600/20"
                        loading={loading}
                    />
                    <StatsCard
                        title="Posts This Month"
                        value={overview?.postsThisMonth?.toLocaleString() || '0'}
                        change={23}
                        icon={<FileText className="text-blue-400" size={24} />}
                        iconBg="bg-blue-600/20"
                        loading={loading}
                    />
                    <StatsCard
                        title="Appointments"
                        value={overview?.appointmentsThisMonth?.toLocaleString() || '0'}
                        change={15}
                        icon={<Calendar className="text-yellow-400" size={24} />}
                        iconBg="bg-yellow-600/20"
                        loading={loading}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doctor Growth Chart */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-dark-100">Doctor Growth</h2>
                            <Link to="/analytics" className="text-sm text-primary-400 hover:text-primary-300">
                                View Details
                            </Link>
                        </div>
                        <SimpleAreaChart
                            data={doctorGrowth}
                            dataKey="value"
                            xAxisKey="date"
                            color="#a855f7"
                            height={250}
                        />
                    </div>

                    {/* Posts Chart */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-dark-100">Daily Posts</h2>
                            <Link to="/analytics" className="text-sm text-primary-400 hover:text-primary-300">
                                View Details
                            </Link>
                        </div>
                        <SimpleBarChart
                            data={postsData}
                            dataKey="value"
                            xAxisKey="date"
                            color="#3b82f6"
                            height={250}
                        />
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Plan Distribution */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-dark-100 mb-4">Plan Distribution</h2>
                        <SimplePieChart
                            data={planDistribution}
                            dataKey="value"
                            nameKey="name"
                            height={200}
                            colors={['#64748b', '#a855f7', '#22c55e']}
                        />
                    </div>

                    {/* System Health */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-dark-100">System Health</h2>
                            <Link to="/system" className="text-sm text-primary-400 hover:text-primary-300">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {systemHealth?.services?.slice(0, 5).map((service) => (
                                <div
                                    key={service.name}
                                    className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
                                >
                                    <div className="flex items-center">
                                        {getHealthStatusIcon(service.status)}
                                        <span className="ml-2 text-dark-200">{service.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {service.latency && (
                                            <span className="text-xs text-dark-500">{service.latency}ms</span>
                                        )}
                                        <span
                                            className={`text-sm font-medium ${getHealthStatusColor(service.status)}`}
                                        >
                                            {service.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-dark-100 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                to="/doctors"
                                className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                            >
                                <div className="flex items-center">
                                    <Users className="text-primary-400 mr-3" size={20} />
                                    <span className="text-dark-200">Manage Doctors</span>
                                </div>
                                <ArrowRight className="text-dark-500" size={16} />
                            </Link>
                            <Link
                                to="/workflows"
                                className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                            >
                                <div className="flex items-center">
                                    <Zap className="text-yellow-400 mr-3" size={20} />
                                    <span className="text-dark-200">View Workflows</span>
                                </div>
                                <ArrowRight className="text-dark-500" size={16} />
                            </Link>
                            <Link
                                to="/logs"
                                className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                            >
                                <div className="flex items-center">
                                    <MessageSquare className="text-blue-400 mr-3" size={20} />
                                    <span className="text-dark-200">System Logs</span>
                                </div>
                                <ArrowRight className="text-dark-500" size={16} />
                            </Link>
                            <Link
                                to="/settings"
                                className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                            >
                                <div className="flex items-center">
                                    <Activity className="text-emerald-400 mr-3" size={20} />
                                    <span className="text-dark-200">System Settings</span>
                                </div>
                                <ArrowRight className="text-dark-500" size={16} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* API Usage */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-dark-100 mb-4">API Usage (This Month)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">OpenAI</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.openai?.calls?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">
                                ${overview?.apiUsage?.openai?.cost?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">Replicate</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.replicate?.calls?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">
                                ${overview?.apiUsage?.replicate?.cost?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">Twilio</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.twilio?.messages?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">
                                ${overview?.apiUsage?.twilio?.cost?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">GMB API</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.gmb?.calls?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-dark-500 mt-1">Free tier</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;