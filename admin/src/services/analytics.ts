import { adminFunctions } from './firebase';
import type {
    AnalyticsOverview,
    TimeSeriesData,
    ChartData,
} from '@/types/admin';

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const result = await adminFunctions.getAnalytics({ type: 'overview' });
    return result.data as AnalyticsOverview;
}

export async function getDoctorGrowthData(
    days: number = 30
): Promise<TimeSeriesData[]> {
    const result = await adminFunctions.getAnalytics({
        type: 'doctorGrowth',
        days,
    });
    return result.data as TimeSeriesData[];
}

export async function getPostsData(days: number = 30): Promise<TimeSeriesData[]> {
    const result = await adminFunctions.getAnalytics({
        type: 'posts',
        days,
    });
    return result.data as TimeSeriesData[];
}

export async function getAppointmentsData(
    days: number = 30
): Promise<TimeSeriesData[]> {
    const result = await adminFunctions.getAnalytics({
        type: 'appointments',
        days,
    });
    return result.data as TimeSeriesData[];
}

export async function getAPIUsageData(days: number = 30): Promise<ChartData> {
    const result = await adminFunctions.getAnalytics({
        type: 'apiUsage',
        days,
    });
    return result.data as ChartData;
}

export async function getRevenueData(
    months: number = 12
): Promise<TimeSeriesData[]> {
    const result = await adminFunctions.getAnalytics({
        type: 'revenue',
        months,
    });
    return result.data as TimeSeriesData[];
}

export async function getPlanDistribution(): Promise<{
    free: number;
    pro: number;
    enterprise: number;
}> {
    const result = await adminFunctions.getAnalytics({
        type: 'planDistribution',
    });
    return result.data as any;
}

export async function getTopPerformingDoctors(
    limit: number = 10
): Promise<
    {
        doctorId: string;
        name: string;
        posts: number;
        appointments: number;
        successRate: number;
    }[]
> {
    const result = await adminFunctions.getAnalytics({
        type: 'topDoctors',
        limit,
    });
    return result.data as any;
}

export async function getAutomationSuccessRate(
    days: number = 30
): Promise<TimeSeriesData[]> {
    const result = await adminFunctions.getAnalytics({
        type: 'automationSuccess',
        days,
    });
    return result.data as TimeSeriesData[];
}