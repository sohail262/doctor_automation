import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: ReactNode;
    iconBg?: string;
    loading?: boolean;
}

const StatsCard = ({
    title,
    value,
    change,
    changeLabel = 'vs last month',
    icon,
    iconBg = 'bg-primary-600/20',
    loading = false,
}: StatsCardProps) => {
    const getTrendIcon = () => {
        if (change === undefined || change === 0) return <Minus size={14} />;
        return change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
    };

    const getTrendColor = () => {
        if (change === undefined || change === 0) return 'text-dark-400';
        return change > 0 ? 'text-emerald-400' : 'text-red-400';
    };

    if (loading) {
        return (
            <div className="card animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-dark-700 rounded"></div>
                        <div className="h-8 w-32 bg-dark-700 rounded"></div>
                        <div className="h-3 w-20 bg-dark-700 rounded"></div>
                    </div>
                    <div className="w-12 h-12 bg-dark-700 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-dark-400">{title}</p>
                    <p className="text-2xl font-bold text-dark-100 mt-1">{value}</p>
                    {change !== undefined && (
                        <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="ml-1">
                                {change > 0 ? '+' : ''}
                                {change}%
                            </span>
                            <span className="text-dark-500 ml-1">{changeLabel}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${iconBg}`}>{icon}</div>
            </div>
        </div>
    );
};

export default StatsCard;