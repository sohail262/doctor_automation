import { useState, useEffect, useCallback } from 'react';
import {
    getSystemHealth,
    getSystemSettings,
    updateSystemSettings,
    getAPIKeys,
    testAPIKey,
} from '@/services/admin-api';
import type { SystemHealth, SystemSettings, APIKey } from '@/types/admin';
import toast from 'react-hot-toast';

export function useSystemHealth() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = useCallback(async () => {
        try {
            const data = await getSystemHealth();
            setHealth(data);
        } catch (error) {
            console.error('Failed to fetch system health:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        // Refresh every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    return { health, loading, refresh: fetchHealth };
}

export function useSystemSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getSystemSettings();
                setSettings(data);
            } catch (error) {
                toast.error('Failed to load settings');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, []);

    const update = async (updates: Partial<SystemSettings>) => {
        setSaving(true);
        try {
            await updateSystemSettings(updates);
            setSettings((prev) => (prev ? { ...prev, ...updates } : null));
            toast.success('Settings saved');
        } catch (error) {
            toast.error('Failed to save settings');
            throw error;
        } finally {
            setSaving(false);
        }
    };

    return { settings, loading, saving, update };
}

export function useAPIKeys() {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState<string | null>(null);

    const fetchKeys = useCallback(async () => {
        try {
            const data = await getAPIKeys();
            setKeys(data);
        } catch (error) {
            toast.error('Failed to load API keys');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const test = async (service: string) => {
        setTesting(service);
        try {
            const result = await testAPIKey(service);
            if (result.success) {
                toast.success(`${service} API: OK (${result.latency}ms)`);
            } else {
                toast.error(`${service} API: ${result.error}`);
            }
            return result;
        } catch (error) {
            toast.error(`Failed to test ${service} API`);
            throw error;
        } finally {
            setTesting(null);
        }
    };

    return { keys, loading, testing, test, refresh: fetchKeys };
}