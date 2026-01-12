import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/useAdminAuth';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Doctors from '@/pages/Doctors';
import DoctorDetail from '@/pages/DoctorDetail';
import Workflows from '@/pages/Workflows';
import WorkflowDetail from '@/pages/WorkflowDetail';
import Logs from '@/pages/Logs';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import SystemHealth from '@/pages/SystemHealth';
import APIKeys from '@/pages/APIKeys';

// Loading component
const LoadingScreen = () => (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, adminUser, loading } = useAdminAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user || !adminUser) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Permission-based Route wrapper
const PermissionRoute = ({
    children,
    resource,
    action,
}: {
    children: React.ReactNode;
    resource: string;
    action: string;
}) => {
    const { hasPermission } = useAdminAuth();

    if (!hasPermission(resource, action)) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-dark-100">Access Denied</h1>
                    <p className="text-dark-400 mt-2">
                        You don't have permission to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

function AppRoutes() {
    const { user, loading } = useAdminAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/doctors"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="doctors" action="view">
                            <Doctors />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/doctors/:id"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="doctors" action="view">
                            <DoctorDetail />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/workflows"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="workflows" action="view">
                            <Workflows />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/workflows/:id"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="workflows" action="view">
                            <WorkflowDetail />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/logs"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="logs" action="view">
                            <Logs />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="analytics" action="view">
                            <Analytics />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/system"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="system" action="view">
                            <SystemHealth />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/api-keys"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="settings" action="view">
                            <APIKeys />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <PermissionRoute resource="settings" action="view">
                            <Settings />
                        </PermissionRoute>
                    </ProtectedRoute>
                }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AdminAuthProvider>
            <AppRoutes />
        </AdminAuthProvider>
    );
}

export default App;