import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signIn, signUp, signOut, resetPassword } from '@/services/auth';
import { createDoctor, getDoctor } from '@/services/firestore';
import type { Doctor } from '@/types';

interface AuthContextType {
    user: User | null;
    doctor: Doctor | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            setUser(user);
            if (user) {
                const doctorData = await getDoctor(user.uid);
                setDoctor(doctorData);
            } else {
                setDoctor(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signIn(email, password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            setError(null);
            setLoading(true);
            const user = await signUp(email, password, name);
            await createDoctor(user.uid, {
                email,
                name,
                specialty: '',
                phone: '',
                address: '',
                bio: '',
                topics: [],
                knowledgeBase: [],
                socialAccounts: {},
                gmbConfig: {
                    accountId: null,
                    locationId: null,
                    accessToken: null,
                    refreshToken: null,
                    connected: false,
                    websiteUrl: null,
                    autoReplyEnabled: true,
                    autoPostEnabled: true,
                },
                calendarConfig: {
                    calendarId: null,
                    accessToken: null,
                    refreshToken: null,
                    connected: false,
                    workingHours: {
                        monday: { start: '09:00', end: '17:00', enabled: true },
                        tuesday: { start: '09:00', end: '17:00', enabled: true },
                        wednesday: { start: '09:00', end: '17:00', enabled: true },
                        thursday: { start: '09:00', end: '17:00', enabled: true },
                        friday: { start: '09:00', end: '17:00', enabled: true },
                        saturday: { start: '09:00', end: '13:00', enabled: false },
                        sunday: { start: '09:00', end: '13:00', enabled: false },
                    },
                    slotDuration: 30,
                },
                whatsappConfig: {
                    enabled: false,
                    phoneNumber: null,
                    welcomeMessage: 'Hello! Welcome to our clinic. How can I help you today?',
                    awayMessage: 'We are currently closed. Please leave a message and we will get back to you.',
                },
                automationSettings: {
                    gmbPostFrequency: 'daily',
                    gmbPostTime: '09:00',
                    socialPostFrequency: 'daily',
                    socialPostTime: '10:00',
                    reminderHours: 24,
                    nextPostTime: null,
                    nextSocialPostTime: null,
                },
            });
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setError(null);
            await signOut();
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
            throw err;
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            setError(null);
            await resetPassword(email);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
            throw err;
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
      value= {{
        user,
            doctor,
            loading,
            error,
            login,
            register,
            logout,
            forgotPassword,
            clearError,
      }
}
    >
    { children }
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};