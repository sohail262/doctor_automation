import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error } = useAdminAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.message || 'Failed to sign in');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-dark-100">Admin Portal</h1>
                    <p className="text-dark-400 mt-1">Doctor Automation SaaS</p>
                </div>

                {/* Form */}
                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="label">Email</label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                                    size={18}
                                />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                                    placeholder="admin@example.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                                    size={18}
                                />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-dark-500 text-sm mt-6">
                    Protected area. Authorized personnel only.
                </p>
            </div>
        </div>
    );
};

export default Login;