import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const registerSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
        acceptTerms: z.boolean().refine((val) => val === true, {
            message: 'You must accept the terms and conditions',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register: registerUser, loading } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser(data.email, data.password, data.name);
            toast.success('Account created successfully!');
            navigate('/onboarding');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account');
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
                        <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
                        <p className="text-gray-600 mt-2">Start automating your practice</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="label">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register('name')}
                                    type="text"
                                    className="input pl-10"
                                    placeholder="Dr. John Smith"
                                />
                            </div>
                            {errors.name && <p className="error-text">{errors.name.message}</p>}
                        </div>

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

                        <div>
                            <label htmlFor="confirmPassword" className="label">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register('confirmPassword')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="flex items-start">
                            <input
                                {...register('acceptTerms')}
                                id="acceptTerms"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                            />
                            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                                I agree to the{' '}
                                <a href="#" className="text-primary-600 hover:text-primary-500">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="text-primary-600 hover:text-primary-500">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>
                        {errors.acceptTerms && <p className="error-text">{errors.acceptTerms.message}</p>}

                        <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;