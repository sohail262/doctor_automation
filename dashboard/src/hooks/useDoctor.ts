import { useState, useEffect } from 'react';
import { subscribeToDoctor, updateDoctor } from '@/services/firestore';
import { useAuth } from './useAuth';
import type { Doctor } from '@/types';

export const useDoctor = () => {
    const { user } = useAuth();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setDoctor(null);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToDoctor(user.uid, (doctorData) => {
            setDoctor(doctorData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const update = async (data: Partial<Doctor>) => {
        if (!user) throw new Error('Not authenticated');
        try {
            setError(null);
            await updateDoctor(user.uid, data);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return { doctor, loading, error, update };
};