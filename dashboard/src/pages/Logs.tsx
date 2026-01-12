import { useState } from 'react';
import { Activity, CheckCircle, AlertCircle, AlertTriangle, Info, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLogs } from '@/hooks/useLogs';
import type { LogEntry } from '@/types';
import { format } from 'date-fns';

const Logs = () => {
    const { logs, loading } = useLogs(200);
    const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');

    const filteredLogs = logs.filter((log) => {
        if (filter === 'all') return true;
        return log.type === filter;
    });

    const getLogIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-500" size={18} />;
            case 'error':
                return <AlertCircle className="text-red-500" size={18} />;
            case 'warning':
                return <AlertTriangle className="text-yellow-500" size={18} />;
            default:
                return <Info className="text-blue-500" size={18} />;
        }
    };

    const getLogBgColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    const exportLogs = () => {
        const csvContent = [
            ['Timestamp', 'Type', 'Action', 'Message'].join(','),
            ...filteredLogs.map((log) =>
                [
                    format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                    log.type,
                    log.action,
                    `"${log.message.replace(/"/g, '""')}"`,
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                        <p className="text-gray-600 mt-1">Monitor your automation activities</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('success')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'success' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Success
                        </button>
                        <button
                            onClick={() => setFilter('error')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'error' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Errors
                        </button>
                        <button
                            onClick={() => setFilter('warning')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'warning' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Warnings
                        </button>
                        <button onClick={exportLogs} className="btn-secondary">
                            <Download size={16} className="mr-1" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Activity className="text-gray-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                                <p className="text-sm text-gray-600">Total</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="text-green-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {logs.filter((l) => l.type === 'success').length}
                                </p>
                                <p className="text-sm text-gray-600">Success</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="text-red-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {logs.filter((l) => l.type === 'error').length}
                                </p>
                                <p className="text-sm text-gray-600">Errors</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <AlertTriangle className="text-yellow-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {logs.filter((l) => l.type === 'warning').length}
                                </p>
                                <p className="text-sm text-gray-600">Warnings</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logs List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="card text-center py-12">
                        <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
                        <p className="text-gray-600 mt-1">Activity logs will appear here</p>
                    </div>
                ) : (
                    <div className="card">
                        <div className="space-y-3">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`p-4 rounded-lg border ${getLogBgColor(log.type)}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        {getLogIcon(log.type)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                                            {log.metadata && (
                                                <details className="mt-2">
                                                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                                        View details
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Logs;