import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Phone,
    MessageSquare,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToAppointments } from '@/services/firestore';
import type { Appointment } from '@/types';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';

const Appointments = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToAppointments(user.uid, (apptData) => {
            setAppointments(apptData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredAppointments = appointments.filter((appt) => {
        const apptDate = new Date(appt.appointmentTime);
        if (filter === 'today') return isToday(apptDate);
        if (filter === 'week') return isThisWeek(apptDate);
        return true;
    });

    const getStatusColor = (status: Appointment['status']) => {
        const colors: Record<string, string> = {
            scheduled: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            completed: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getSourceIcon = (source: Appointment['source']) => {
        switch (source) {
            case 'whatsapp':
                return <MessageSquare className="text-green-500" size={16} />;
            case 'website':
                return <Calendar className="text-blue-500" size={16} />;
            default:
                return <User className="text-gray-500" size={16} />;
        }
    };

    const groupByDate = (appts: Appointment[]) => {
        const groups: Record<string, Appointment[]> = {};
        appts.forEach((appt) => {
            const date = format(new Date(appt.appointmentTime), 'yyyy-MM-dd');
            if (!groups[date]) groups[date] = [];
            groups[date].push(appt);
        });
        return groups;
    };

    const groupedAppointments = groupByDate(filteredAppointments);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-gray-600 mt-1">Manage your scheduled appointments</p>
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
                            onClick={() => setFilter('today')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'today' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setFilter('week')}
                            className={`px-4 py-2 text-sm rounded-lg ${filter === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            This Week
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : Object.keys(groupedAppointments).length === 0 ? (
                    <div className="card text-center py-12">
                        <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900">No appointments</h3>
                        <p className="text-gray-600 mt-1">Upcoming appointments will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedAppointments).map(([date, appts]) => {
                            const dateObj = new Date(date);
                            let dateLabel = format(dateObj, 'EEEE, MMMM d, yyyy');
                            if (isToday(dateObj)) dateLabel = 'Today';
                            else if (isTomorrow(dateObj)) dateLabel = 'Tomorrow';

                            return (
                                <div key={date}>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        {dateLabel}
                                    </h3>
                                    <div className="space-y-3">
                                        {appts.map((appt) => (
                                            <div key={appt.id} className="card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                                            <User className="text-primary-600" size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <h4 className="font-medium text-gray-900">{appt.patientName}</h4>
                                                                {getSourceIcon(appt.source)}
                                                            </div>
                                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                                                <span className="flex items-center">
                                                                    <Clock size={14} className="mr-1" />
                                                                    {format(new Date(appt.appointmentTime), 'h:mm a')}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <Phone size={14} className="mr-1" />
                                                                    {appt.patientPhone}
                                                                </span>
                                                            </div>
                                                            {appt.reason && (
                                                                <p className="text-sm text-gray-500 mt-1">{appt.reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(appt.status)}`}>
                                                            {appt.status}
                                                        </span>
                                                        {appt.reminderSent && (
                                                            <span className="text-xs text-gray-500 flex items-center">
                                                                <CheckCircle size={14} className="mr-1 text-green-500" />
                                                                Reminder sent
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Appointments;