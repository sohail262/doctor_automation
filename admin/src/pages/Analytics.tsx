import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    FileText,
    Calendar,
    DollarSign,
    Download,
    RefreshCw,
} from 'lucide-react';
import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import {
    SimpleAreaChart,
    SimpleBarChart,
    SimplePieChart,
    MultiLineChart,
} from '@/components/Charts';
import {
    getAnalyticsOverview,
    getDoctorGrowthData,
    getPostsData,
    getAppointmentsData,
    getPlanDistribution,
    getTopPerformingDoctors,
    getAutomationSuccessRate,
    getRevenueData,
} from '@/services/analytics';
import type { AnalyticsOverview, TimeSeriesData } from '@/types/admin';
import { format, subDays } from 'date-fns';

const Analytics = () => {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(30);

    // Chart data
    const [doctorGrowth, setDoctorGrowth] = useState<TimeSeriesData[]>([]);
    const [postsData, setPostsData] = useState<TimeSeriesData[]>([]);
    const [appointmentsData, setAppointmentsData] = useState<TimeSeriesData[]>([]);
    const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number }[]>([]);
    const [topDoctors, setTopDoctors] = useState<any[]>([]);
    const [successRate, setSuccessRate] = useState<TimeSeriesData[]>([]);
    const [revenueData, setRevenueData] = useState<TimeSeriesData[]>([]);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                overviewRes,
                growthRes,
                postsRes,
                appointmentsRes,
                plansRes,
                topRes,
                successRes,
                revenueRes,
            ] = await Promise.all([
                getAnalyticsOverview(),
                getDoctorGrowthData(dateRange),
                getPostsData(dateRange),
                getAppointmentsData(dateRange),
                getPlanDistribution(),
                getTopPerformingDoctors(10),
                getAutomationSuccessRate(dateRange),
                getRevenueData(12),
            ]);

            setOverview(overviewRes);
            setDoctorGrowth(growthRes);
            setPostsData(postsRes);
            setAppointmentsData(appointmentsRes);
            setPlanDistribution([
                { name: 'Free', value: plansRes.free },
                { name: 'Pro', value: plansRes.pro },
                { name: 'Enterprise', value: plansRes.enterprise },
            ]);
            setTopDoctors(topRes);
            setSuccessRate(successRes);
            setRevenueData(revenueRes);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">Analytics</h1>
                        <p className="text-dark-400 mt-1">Platform performance and insights</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(parseInt(e.target.value))}
                            className="input w-40"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                        <button onClick={fetchData} className="btn-secondary">
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                        </button>
                        <button className="btn-secondary">
                            <Download size={16} className="mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
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
                        icon={<Calendar className="text-emerald-400" size={24} />}
                        iconBg="bg-emerald-600/20"
                        loading={loading}
                    />
                    <StatsCard
                        title="MRR"
                        value={`$${overview?.revenueMetrics?.mrr?.toLocaleString() || '0'}`}
                        change={8}
                        icon={<DollarSign className="text-yellow-400" size={24} />}
                        iconBg="bg-yellow-600/20"
                        loading={loading}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Doctor Growth</h3>
                        <SimpleAreaChart
                            data={doctorGrowth}
                            dataKey="value"
                            xAxisKey="date"
                            color="#a855f7"
                            height={300}
                        />
                    </div>
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Posts & Appointments</h3>
                        <MultiLineChart
                            data={postsData.map((p, i) => ({
                                date: p.date,
                                posts: p.value,
                                appointments: appointmentsData[i]?.value || 0,
                            }))}
                            lines={[
                                { dataKey: 'posts', color: '#3b82f6', name: 'Posts' },
                                { dataKey: 'appointments', color: '#22c55e', name: 'Appointments' },
                            ]}
                            xAxisKey="date"
                            height={300}
                        />
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Plan Distribution</h3>
                        <SimplePieChart
                            data={planDistribution}
                            dataKey="value"
                            nameKey="name"
                            height={250}
                            colors={['#64748b', '#a855f7', '#22c55e']}
                        />
                    </div>
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Automation Success Rate</h3>
                        <SimpleAreaChart
                            data={successRate}
                            dataKey="value"
                            xAxisKey="date"
                            color="#22c55e"
                            height={250}
                        />
                    </div>
                    <div className="card">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Revenue Trend</h3>
                        <SimpleBarChart
                            data={revenueData}
                            dataKey="value"
                            xAxisKey="date"
                            color="#f59e0b"
                            height={250}
                        />
                    </div>
                </div>

                {/* Top Performing Doctors */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-dark-100 mb-4">Top Performing Doctors</h3>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Doctor</th>
                                    <th>Posts</th>
                                    <th>Appointments</th>
                                    <th>Success Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topDoctors.map((doctor, index) => (
                                    <tr key={doctor.doctorId}>
                                        <td>
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-dark-700 text-dark-300'
                                                    }`}
                                            >
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-medium text-dark-200">{doctor.name}</span>
                                        </td>
                                        <td>{doctor.posts}</td>
                                        <td>{doctor.appointments}</td>
                                        <td>
                                            <span
                                                className={
                                                    doctor.successRate >= 90
                                                        ? 'text-emerald-400'
                                                        : doctor.successRate >= 70
                                                            ? 'text-yellow-400'
                                                            : 'text-red-400'
                                                }
                                            >
                                                {doctor.successRate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* API Usage */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-dark-100 mb-4">API Usage & Costs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">OpenAI</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.openai?.calls?.toLocaleString() || '0'} calls
                            </p>
                            <p className="text-sm text-dark-500 mt-1">
                                {overview?.apiUsage?.openai?.tokens?.toLocaleString() || '0'} tokens
                            </p>
                            <p className="text-lg font-semibold text-yellow-400 mt-2">
                                ${overview?.apiUsage?.openai?.cost?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">Replicate</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.replicate?.calls?.toLocaleString() || '0'} calls
                            </p>
                            <p className="text-sm text-dark-500 mt-1">Image generation</p>
                            <p className="text-lg font-semibold text-yellow-400 mt-2">
                                ${overview?.apiUsage?.replicate?.cost?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">Twilio</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.twilio?.messages?.toLocaleString() || '0'} messages
                            </p>
                            <p className="text-sm text-dark-500 mt-1">WhatsApp / SMS</p>
                            <p className="text-lg font-semibold text-yellow-400 mt-2">
                                ${overview?.apiUsage?.twilio?.cost?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="p-4 bg-dark-800 rounded-lg">
                            <p className="text-sm text-dark-400">Google APIs</p>
                            <p className="text-xl font-bold text-dark-100 mt-1">
                                {overview?.apiUsage?.gmb?.calls?.toLocaleString() || '0'} calls
                            </p>
                            <p className="text-sm text-dark-500 mt-1">GMB / Calendar</p>
                            <p className="text-lg font-semibold text-emerald-400 mt-2">Free tier</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Analytics;