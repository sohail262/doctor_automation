import { useState } from 'react';
import { format } from 'date-fns';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    Bug,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Copy,
    ExternalLink,
} from 'lucide-react';
import type { SystemLog } from '@/types/admin';
import toast from 'react-hot-toast';

interface LogViewerProps {
    logs: SystemLog[];
    loading?: boolean;
    onLogClick?: (log: SystemLog) => void;
}

const LogViewer = ({ logs, loading = false, onLogClick }: LogViewerProps) => {
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    const toggleExpand = (logId: string) => {
        setExpandedLogs((prev) => {
            const next = new Set(prev);
            if (next.has(logId)) {
                next.delete(logId);
            } else {
                next.add(logId);
            }
            return next;
        });
    };

    const copyLog = (log: SystemLog) => {
        navigator.clipboard.writeText(JSON.stringify(log, null, 2));
        toast.success('Log copied to clipboard');
    };

    const getLevelIcon = (level: SystemLog['level']) => {
        const icons = {
            debug: <Bug size={16} className="text-dark-400" />,
            info: <Info size={16} className="text-blue-400" />,
            warn: <AlertTriangle size={16} className="text-yellow-400" />,
            error: <AlertCircle size={16} className="text-red-400" />,
            critical: <AlertCircle size={16} className="text-red-500" />,
        };
        return icons[level];
    };

    const getLevelBadge = (level: SystemLog['level']) => {
        const classes = {
            debug: 'badge-neutral',
            info: 'badge-info',
            warn: 'badge-warning',
            error: 'badge-danger',
            critical: 'bg-red-600 text-white',
        };
        return <span className={`badge ${classes[level]}`}>{level.toUpperCase()}</span>;
    };

    const getSourceBadge = (source: SystemLog['source']) => {
        const colors: Record<string, string> = {
            function: 'bg-purple-500/20 text-purple-400',
            api: 'bg-blue-500/20 text-blue-400',
            webhook: 'bg-green-500/20 text-green-400',
            scheduler: 'bg-yellow-500/20 text-yellow-400',
            admin: 'bg-pink-500/20 text-pink-400',
            system: 'bg-dark-600 text-dark-300',
        };
        return <span className={`badge ${colors[source] || 'badge-neutral'}`}>{source}</span>;
    };

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-dark-800 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-12">
                <CheckCircle className="mx-auto text-dark-500 mb-4" size={48} />
                <p className="text-dark-400">No logs found</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 font-mono text-sm">
            {logs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                return (
                    <div
                        key={log.id}
                        className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden"
                    >
                        <div
                            className="flex items-center px-4 py-3 cursor-pointer hover:bg-dark-750"
                            onClick={() => hasMetadata && toggleExpand(log.id)}
                        >
                            {/* Expand Icon */}
                            <div className="w-6">
                                {hasMetadata &&
                                    (isExpanded ? (
                                        <ChevronDown size={16} className="text-dark-400" />
                                    ) : (
                                        <ChevronRight size={16} className="text-dark-400" />
                                    ))}
                            </div>

                            {/* Level Icon */}
                            <div className="w-6">{getLevelIcon(log.level)}</div>

                            {/* Timestamp */}
                            <div className="w-40 text-dark-500 text-xs">
                                {format(
                                    log.createdAt?.toDate?.() || new Date(log.createdAt as any),
                                    'MMM dd HH:mm:ss.SSS'
                                )}
                            </div>

                            {/* Level Badge */}
                            <div className="w-20">{getLevelBadge(log.level)}</div>

                            {/* Source Badge */}
                            <div className="w-24">{getSourceBadge(log.source)}</div>

                            {/* Action */}
                            <div className="w-40 text-dark-300 truncate">{log.action}</div>

                            {/* Message */}
                            <div className="flex-1 text-dark-100 truncate">{log.message}</div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyLog(log);
                                    }}
                                    className="p-1 text-dark-400 hover:text-dark-100"
                                    title="Copy log"
                                >
                                    <Copy size={14} />
                                </button>
                                {log.doctorId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLogClick?.(log);
                                        }}
                                        className="p-1 text-dark-400 hover:text-dark-100"
                                        title="View doctor"
                                    >
                                        <ExternalLink size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && hasMetadata && (
                            <div className="px-4 py-3 bg-dark-900 border-t border-dark-700">
                                <pre className="text-xs text-dark-300 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                                {log.stackTrace && (
                                    <div className="mt-3 pt-3 border-t border-dark-700">
                                        <p className="text-xs text-dark-500 mb-2">Stack Trace:</p>
                                        <pre className="text-xs text-red-400 overflow-x-auto whitespace-pre-wrap">
                                            {log.stackTrace}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default LogViewer;