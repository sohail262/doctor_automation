import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import Posts from '@/pages/Posts';
import Appointments from '@/pages/Appointments';
import Logs from '@/pages/Logs';
import Settings from '@/pages/Settings';

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

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
                    path="/onboarding"
                    element={
                        <ProtectedRoute>
                            <Onboarding />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/posts"
                    element={
                        <ProtectedRoute>
                            <Posts />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/appointments"
                    element={
                        <ProtectedRoute>
                            <Appointments />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/logs"
                    element={
                        <ProtectedRoute>
                            <Logs />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;