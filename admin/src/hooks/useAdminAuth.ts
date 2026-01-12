import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import type { AdminUser, AdminPermissions } from '@/types/admin';

interface AdminAuthContextType {
    user: User | null;
    adminUser: AdminUser | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (resource: string, action: string) => boolean;
    clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS: AdminPermissions = {
    doctors: { view: false, create: false, edit: false, delete: false, impersonate: false },
    workflows: { view: false, edit: false, trigger: false, pause: false },
    logs: { view: false, export: false, delete: false },
    settings: { view: false, edit: false },
    analytics: { view: false, export: false },
    system: { view: false, manage: false },
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Get admin user data
                    const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));

                    if (adminDoc.exists()) {
                        const adminData = adminDoc.data() as Omit<AdminUser, 'uid'>;
                        setAdminUser({
                            uid: firebaseUser.uid,
                            ...adminData,
                        });
                    } else {
                        // Not an admin
                        setError('Access denied. You are not an admin.');
                        await firebaseSignOut(auth);
                        setAdminUser(null);
                    }
                } catch (err) {
                    console.error('Error fetching admin data:', err);
                    setError('Failed to load admin profile');
                }
            } else {
                setAdminUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
        }
    };

    const hasPermission = (resource: string, action: string): boolean => {
        if (!adminUser) return false;
        if (adminUser.role === 'super_admin') return true;

        const permissions = adminUser.permissions || DEFAULT_PERMISSIONS;
        const resourcePerms = permissions[resource as keyof AdminPermissions];

        if (!resourcePerms) return false;
        return (resourcePerms as Record<string, boolean>)[action] || false;
    };

    const clearError = () => setError(null);

    return (
        <AdminAuthContext.Provider
      value= {{
        user,
            adminUser,
            loading,
            error,
            login,
            logout,
            hasPermission,
            clearError,
      }
}
    >
    { children }
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
};