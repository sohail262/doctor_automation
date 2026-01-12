import { useState, useEffect, useCallback } from 'react';
import {
    ScrollText,
    Filter,
    Download,
    RefreshCw,
    Search,
    AlertCircle,
    AlertTriangle,
    Info,
    Bug,
    Clock,
    Trash2,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import LogViewer from '@/components/LogViewer';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getLogs, exportLogs, subscribeToLogs } from '@/services/admin-api';
import type { SystemLog, LogFilters, PaginationParams } from '@/types/admin';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const Logs = () => {
    const { hasPermission } = useAdminAuth();
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveMode, setLiveMode] = useState(false);
    const [filters, setFilters] = useState<LogFilters>({});
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [pagination, setPagination] = useState<PaginationParams>({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getLogs(filters, pagination);
            setLogs(result.data);
        } catch (error) {
            toast.error('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => {
        if (liveMode) {
            const unsubscribe = subscribeToLogs((newLogs) => {
                setLogs(newLogs);
                setLoading(false);
            }, 100);
            return () => unsubscribe();
        } else {
            fetchLogs();
        }
    }, [liveMode, fetchLogs]);

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const url = await exportLogs(filters, format);
            window.open(url, '_blank');
            toast.success('Export started');
        } catch (error) {
            toast.error('Failed to export logs');
        }
    };

    const handleClearFilters = () => {
        setFilters({});
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const levelCounts = {
        error: logs.filter((l) => l.level === 'error' || l.level === 'critical').length,
        warn: logs.filter((l) => l.level === 'warn').length,
        info: logs.filter((l) => l.level === 'info').length,
        debug: logs.filter((l) => l.level === 'debug').length,
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-100">System Logs</h1>
                        <p className="text-dark-400 mt-1">View and analyze system activity</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Live Mode Toggle */}
                        <button
                            onClick={() => setLiveMode(!liveMode)}
                            className={`btn-sm ${liveMode ? 'btn-success' : 'btn-secondary'}`}
                        >
                            <Clock size={16} className={`mr-2 ${liveMode ? 'animate-pulse' : ''}`} />
                            {liveMode ? 'Live' : 'Static'}
                        </button>

                        <button onClick={() => setFilterModalOpen(true)} className="btn-secondary">
                            <Filter size={16} className="mr-2" />
                            Filters
                        </button>

                        {hasPermission('logs', 'export') && (
                            <div className="relative group">
                                <button className="btn-secondary">
                                    <Download size={16} className="mr-2" />
                                    Export
                                </button>
                                <div className="absolute right-0 mt-2 w-32 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-1 hidden group-hover:block z-10">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="dropdown-item w-full text-left"
                                    >
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="dropdown-item w-full text-left"
                                    >
                                        Export JSON
                                    </button>
                                </div>
                            </div>
                        )}

                        {!liveMode && (
                            <button onClick={fetchLogs} className="btn-secondary">
                                <RefreshCw size={16} className="mr-2" />
                                Refresh
                            </button>
                        )}
                    </div>
                </div>

                {/* Level Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <button
                        onClick={() => setFilters((prev) => ({ ...prev, level: 'error' }))}
                        className={`card cursor-pointer transition-colors ${filters.level === 'error' ? 'border-red-500' : 'hover:border-dark-600'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="text-red-400" size={20} />
                            <div>
                                <p className="text-2xl font-bold text-red-400">{levelCounts.error}</p>
                                <p className="text-xs text-dark-500">Errors</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilters((prev) => ({ ...prev, level: 'warn' }))}
                        className={`card cursor-pointer transition-colors ${filters.level === 'warn' ? 'border-yellow-500' : 'hover:border-dark-600'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="text-yellow-400" size={20} />
                            <div>
                                <p className="text-2xl font-bold text-yellow-400">{levelCounts.warn}</p>
                                <p className="text-xs text-dark-500">Warnings</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilters((prev) => ({ ...prev, level: 'info' }))}
                        className={`card cursor-pointer transition-colors ${filters.level === 'info' ? 'border-blue-500' : 'hover:border-dark-600'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <Info className="text-blue-400" size={20} />
                            <div>
                                <p className="text-2xl font-bold text-blue-400">{levelCounts.info}</p>
                                <p className="text-xs text-dark-500">Info</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilters((prev) => ({ ...prev, level: 'debug' }))}
                        className={`card cursor-pointer transition-colors ${filters.level === 'debug' ? 'border-dark-500' : 'hover:border-dark-600'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <Bug className="text-dark-400" size={20} />
                            <div>
                                <p className="text-2xl font-bold text-dark-400">{levelCounts.debug}</p>
                                <p className="text-xs text-dark-500">Debug</p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Active Filters */}
                {Object.keys(filters).length > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-dark-400">Active filters:</span>
                        {filters.level && (
                            <span className="badge badge-info">
                                Level: {filters.level}
                                <button
                                    onClick={() => setFilters((prev) => ({ ...prev, level: undefined }))}
                                    className="ml-1"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {filters.source && (
                            <span className="badge badge-info">
                                Source: {filters.source}
                                <button
                                    onClick={() => setFilters((prev) => ({ ...prev, source: undefined }))}
                                    className="ml-1"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {filters.search && (
                            <span className="badge badge-info">
                                Search: {filters.search}
                                <button
                                    onClick={() => setFilters((prev) => ({ ...prev, search: undefined }))}
                                    className="ml-1"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-primary-400 hover:text-primary-300"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
                    <input
                        type="text"
                        value={filters.search || ''}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        placeholder="Search logs..."
                        className="input pl-10 w-full max-w-md"
                    />
                </div>

                {/* Log Viewer */}
                <div className="card">
                    <LogViewer logs={logs} loading={loading} />
                </div>

                {/* Filter Modal */}
                <Modal
                    isOpen={filterModalOpen}
                    onClose={() => setFilterModalOpen(false)}
                    title="Filter Logs"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="label">Level</label>
                            <select
                                value={filters.level || ''}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        level: e.target.value as any || undefined,
                                    }))
                                }
                                className="input"
                            >
                                <option value="">All Levels</option>
                                <option value="debug">Debug</option>
                                <option value="info">Info</option>
                                <option value="warn">Warning</option>
                                <option value="error">Error</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Source</label>
                            <select
                                value={filters.source || ''}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        source: e.target.value as any || undefined,
                                    }))
                                }
                                className="input"
                            >
                                <option value="">All Sources</option>
                                <option value="function">Cloud Functions</option>
                                <option value="api">API</option>
                                <option value="webhook">Webhook</option>
                                <option value="scheduler">Scheduler</option>
                                <option value="admin">Admin</option>
                                <option value="system">System</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Doctor ID</label>
                            <input
                                type="text"
                                value={filters.doctorId || ''}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        doctorId: e.target.value || undefined,
                                    }))
                                }
                                className="input"
                                placeholder="Filter by doctor ID..."
                            />
                        </div>

                        <div>
                            <label className="label">Workflow ID</label>
                            <input
                                type="text"
                                value={filters.workflowId || ''}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        workflowId: e.target.value || undefined,
                                    }))
                                }
                                className="input"
                                placeholder="Filter by workflow ID..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">From Date</label>
                                <input
                                    type="date"
                                    value={
                                        filters.dateRange?.start
                                            ? format(filters.dateRange.start, 'yyyy-MM-dd')
                                            : ''
                                    }
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            dateRange: {
                                                ...prev.dateRange,
                                                start: e.target.value ? new Date(e.target.value) : undefined,
                                                end: prev.dateRange?.end || new Date(),
                                            },
                                        }))
                                    }
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">To Date</label>
                                <input
                                    type="date"
                                    value={
                                        filters.dateRange?.end
                                            ? format(filters.dateRange.end, 'yyyy-MM-dd')
                                            : ''
                                    }
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            dateRange: {
                                                ...prev.dateRange,
                                                start: prev.dateRange?.start || subDays(new Date(), 7),
                                                end: e.target.value ? new Date(e.target.value) : undefined,
                                            },
                                        }))
                                    }
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={handleClearFilters} className="btn-ghost">
                            Clear All
                        </button>
                        <button onClick={() => setFilterModalOpen(false)} className="btn-primary">
                            Apply Filters
                        </button>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
};

export default Logs;