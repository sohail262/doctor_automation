import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useAuth();
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
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign in');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-2xl">D</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                        <p className="text-gray-600 mt-2">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="label">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="input pl-10"
                                    placeholder="doctor@example.com"
                                />
                            </div>
                            {errors.email && <p className="error-text">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="error-text">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;