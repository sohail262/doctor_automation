import { useState, useEffect } from 'react';
import { subscribeToLogs } from '@/services/firestore';
import { useAuth } from './useAuth';
import type { LogEntry } from '@/types';

export const useLogs = (limitCount: number = 100) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLogs([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToLogs(user.uid, (logsData) => {
            setLogs(logsData);
            setLoading(false);
        }, limitCount);

        return () => unsubscribe();
    }, [user, limitCount]);

    return { logs, loading };
};