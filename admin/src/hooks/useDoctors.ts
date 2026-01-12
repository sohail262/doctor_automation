import { useState, useEffect, useCallback } from 'react';
import {
    getDoctors,
    getDoctor,
    updateDoctor,
    suspendDoctor,
    unsuspendDoctor,
    deleteDoctor,
    bulkUpdateDoctors,
} from '@/services/admin-api';
import type {
    DoctorAdmin,
    DoctorFilters,
    PaginationParams,
    PaginatedResult,
} from '@/types/admin';
import toast from 'react-hot-toast';

const DEFAULT_PAGINATION: PaginationParams = {
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
};

export function useDoctors(initialFilters?: DoctorFilters) {
    const [doctors, setDoctors] = useState<DoctorAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<DoctorFilters>(initialFilters || {});
    const [pagination, setPagination] = useState<PaginationParams>(DEFAULT_PAGINATION);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getDoctors(filters, pagination);
            setDoctors(result.data);
            setTotal(result.total);
        } catch (error: any) {
            toast.error('Failed to fetch doctors');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const updateFilters = (newFilters: Partial<DoctorFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const updatePagination = (newPagination: Partial<PaginationParams>) => {
        setPagination((prev) => ({ ...prev, ...newPagination }));
    };

    const handleUpdateDoctor = async (
        doctorId: string,
        updates: Partial<DoctorAdmin>
    ) => {
        try {
            await updateDoctor(doctorId, updates);
            toast.success('Doctor updated');
            fetchDoctors();
        } catch (error: any) {
            toast.error('Failed to update doctor');
            throw error;
        }
    };

    const handleSuspendDoctor = async (doctorId: string, reason: string) => {
        try {
            await suspendDoctor(doctorId, reason);
            toast.success('Doctor suspended');
            fetchDoctors();
        } catch (error: any) {
            toast.error('Failed to suspend doctor');
            throw error;
        }
    };

    const handleUnsuspendDoctor = async (doctorId: string) => {
        try {
            await unsuspendDoctor(doctorId);
            toast.success('Doctor unsuspended');
            fetchDoctors();
        } catch (error: any) {
            toast.error('Failed to unsuspend doctor');
            throw error;
        }
    };

    const handleDeleteDoctor = async (doctorId: string) => {
        try {
            await deleteDoctor(doctorId);
            toast.success('Doctor deleted');
            fetchDoctors();
        } catch (error: any) {
            toast.error('Failed to delete doctor');
            throw error;
        }
    };

    const handleBulkUpdate = async (
        doctorIds: string[],
        updates: Partial<DoctorAdmin>
    ) => {
        try {
            await bulkUpdateDoctors(doctorIds, updates);
            toast.success(`Updated ${doctorIds.length} doctors`);
            fetchDoctors();
        } catch (error: any) {
            toast.error('Failed to update doctors');
            throw error;
        }
    };

    return {
        doctors,
        total,
        loading,
        filters,
        pagination,
        totalPages: Math.ceil(total / pagination.limit),
        updateFilters,
        updatePagination,
        refresh: fetchDoctors,
        updateDoctor: handleUpdateDoctor,
        suspendDoctor: handleSuspendDoctor,
        unsuspendDoctor: handleUnsuspendDoctor,
        deleteDoctor: handleDeleteDoctor,
        bulkUpdate: handleBulkUpdate,
    };
}

export function useDoctor(doctorId: string | null) {
    const [doctor, setDoctor] = useState<DoctorAdmin | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!doctorId) {
            setDoctor(null);
            setLoading(false);
            return;
        }

        const fetchDoctor = async () => {
            setLoading(true);
            try {
                const data = await getDoctor(doctorId);
                setDoctor(data);
            } catch (error) {
                toast.error('Failed to fetch doctor');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [doctorId]);

    const update = async (updates: Partial<DoctorAdmin>) => {
        if (!doctorId) return;
        await updateDoctor(doctorId, updates);
        const data = await getDoctor(doctorId);
        setDoctor(data);
    };

    return { doctor, loading, update };
}