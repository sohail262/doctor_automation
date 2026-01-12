import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartProps {
    data: any[];
    height?: number;
}

interface LineChartProps extends ChartProps {
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    showGrid?: boolean;
}

export const SimpleLineChart = ({
    data,
    dataKey,
    xAxisKey = 'date',
    color = '#a855f7',
    height = 300,
    showGrid = true,
}: LineChartProps) => (
    <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
            />
            <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: color }}
            />
        </LineChart>
    </ResponsiveContainer>
);

interface AreaChartProps extends ChartProps {
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    gradientId?: string;
}

export const SimpleAreaChart = ({
    data,
    dataKey,
    xAxisKey = 'date',
    color = '#a855f7',
    height = 300,
    gradientId = 'colorValue',
}: AreaChartProps) => (
    <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                }}
            />
            <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
            />
        </AreaChart>
    </ResponsiveContainer>
);

interface MultiLineChartProps extends ChartProps {
    lines: { dataKey: string; color: string; name: string }[];
    xAxisKey?: string;
}

export const MultiLineChart = ({
    data,
    lines,
    xAxisKey = 'date',
    height = 300,
}: MultiLineChartProps) => (
    <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                }}
            />
            <Legend />
            {lines.map((line) => (
                <Line
                    key={line.dataKey}
                    type="monotone"
                    dataKey={line.dataKey}
                    stroke={line.color}
                    name={line.name}
                    strokeWidth={2}
                    dot={false}
                />
            ))}
        </LineChart>
    </ResponsiveContainer>
);

interface BarChartProps extends ChartProps {
    dataKey: string;
    xAxisKey?: string;
    color?: string;
}

export const SimpleBarChart = ({
    data,
    dataKey,
    xAxisKey = 'name',
    color = '#a855f7',
    height = 300,
}: BarChartProps) => (
    <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);

interface PieChartProps extends ChartProps {
    dataKey: string;
    nameKey?: string;
    colors?: string[];
}

export const SimplePieChart = ({
    data,
    dataKey,
    nameKey = 'name',
    height = 300,
    colors = ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
}: PieChartProps) => (
    <ResponsiveContainer width="100%" height={height}>
        <PieChart>
            <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
            >
                {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
            </Pie>
            <Tooltip
                contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                }}
            />
            <Legend />
        </PieChart>
    </ResponsiveContainer>
);