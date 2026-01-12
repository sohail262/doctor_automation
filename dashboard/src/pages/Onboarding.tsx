import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Stethoscope,
    MapPin,
    Phone,
    FileText,
    Globe,
    Calendar,
    MessageCircle,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateDoctor } from '@/services/firestore';
import toast from 'react-hot-toast';

const steps = [
    { id: 1, name: 'Profile', icon: User },
    { id: 2, name: 'Practice', icon: Stethoscope },
    { id: 3, name: 'Content', icon: FileText },
    { id: 4, name: 'Integrations', icon: Globe },
    { id: 5, name: 'Review', icon: CheckCircle },
];

const profileSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    specialty: z.string().min(2, 'Specialty is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    address: z.string().min(5, 'Address is required'),
    bio: z.string().min(50, 'Bio must be at least 50 characters'),
});

const practiceSchema = z.object({
    topics: z.string().min(1, 'At least one topic required'),
    knowledgeBase: z.string().optional(),
    slotDuration: z.number().min(15).max(120),
});

const integrationsSchema = z.object({
    gmbToken: z.string().optional(),
    calendarId: z.string().optional(),
    enableWhatsApp: z.boolean(),
});

const Onboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        phone: '',
        address: '',
        bio: '',
        topics: '',
        knowledgeBase: '',
        slotDuration: 30,
        gmbToken: '',
        calendarId: '',
        enableWhatsApp: false,
    });
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    const updateFormData = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await updateDoctor(user.uid, {
                name: formData.name,
                specialty: formData.specialty,
                phone: formData.phone,
                address: formData.address,
                bio: formData.bio,
                topics: formData.topics.split(',').map((t) => t.trim()),
                knowledgeBase: formData.knowledgeBase ? formData.knowledgeBase.split('\n') : [],
                calendarConfig: {
                    calendarId: formData.calendarId || null,
                    accessToken: null,
                    refreshToken: null,
                    connected: !!formData.calendarId,
                    workingHours: {
                        monday: { start: '09:00', end: '17:00', enabled: true },
                        tuesday: { start: '09:00', end: '17:00', enabled: true },
                        wednesday: { start: '09:00', end: '17:00', enabled: true },
                        thursday: { start: '09:00', end: '17:00', enabled: true },
                        friday: { start: '09:00', end: '17:00', enabled: true },
                        saturday: { start: '09:00', end: '13:00', enabled: false },
                        sunday: { start: '09:00', end: '13:00', enabled: false },
                    },
                    slotDuration: formData.slotDuration,
                },
                whatsappConfig: {
                    enabled: formData.enableWhatsApp,
                    phoneNumber: formData.phone,
                    welcomeMessage: 'Hello! Welcome to our clinic. How can I help you today?',
                    awayMessage: 'We are currently closed. Please leave a message.',
                },
                automationSettings: {
                    gmbPostFrequency: 'daily',
                    gmbPostTime: '09:00',
                    socialPostFrequency: 'daily',
                    socialPostTime: '10:00',
                    reminderHours: 24,
                    nextPostTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    nextSocialPostTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
                onboarded: true,
                active: true,
            });

            toast.success('Setup complete! Your automations are now active.');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step.id
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    <step.icon size={20} />
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-full h-1 mx-2 ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                                            }`}
                                        style={{ width: '60px' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {steps.map((step) => (
                            <span
                                key={step.id}
                                className={`text-xs ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                {step.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="card">
                    {/* Step 1: Profile */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
                                <p className="text-gray-600 mt-1">Tell us about yourself</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => updateFormData({ name: e.target.value })}
                                        className="input"
                                        placeholder="Dr. John Smith"
                                    />
                                </div>
                                <div>
                                    <label className="label">Specialty</label>
                                    <input
                                        type="text"
                                        value={formData.specialty}
                                        onChange={(e) => updateFormData({ specialty: e.target.value })}
                                        className="input"
                                        placeholder="General Dentist"
                                    />
                                </div>
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData({ phone: e.target.value })}
                                        className="input"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <label className="label">Practice Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => updateFormData({ address: e.target.value })}
                                        className="input"
                                        placeholder="123 Main St, City, State"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => updateFormData({ bio: e.target.value })}
                                    className="input h-32"
                                    placeholder="Tell patients about your experience, qualifications, and approach to care..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Practice */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Practice</h2>
                                <p className="text-gray-600 mt-1">Configure your services and scheduling</p>
                            </div>

                            <div>
                                <label className="label">Topics for Content Generation</label>
                                <textarea
                                    value={formData.topics}
                                    onChange={(e) => updateFormData({ topics: e.target.value })}
                                    className="input h-24"
                                    placeholder="teeth whitening, dental implants, oral hygiene tips, gum health..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Comma-separated list of topics for posts</p>
                            </div>

                            <div>
                                <label className="label">Knowledge Base for Auto-Replies</label>
                                <textarea
                                    value={formData.knowledgeBase}
                                    onChange={(e) => updateFormData({ knowledgeBase: e.target.value })}
                                    className="input h-32"
                                    placeholder="Enter guidelines for how to respond to reviews. One per line.&#10;Example: Always thank reviewers&#10;Offer free consultation for complaints"
                                />
                            </div>

                            <div>
                                <label className="label">Appointment Slot Duration (minutes)</label>
                                <select
                                    value={formData.slotDuration}
                                    onChange={(e) => updateFormData({ slotDuration: parseInt(e.target.value) })}
                                    className="input"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Content Settings</h2>
                                <p className="text-gray-600 mt-1">Configure how your content is generated</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900">AI-Generated Content</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Our AI will automatically generate posts based on your topics. You can preview and
                                    edit content before it's posted, or enable fully automated posting.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">GMB Posts</h4>
                                    <p className="text-sm text-gray-600 mt-1">Daily at 9:00 AM</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Social Media</h4>
                                    <p className="text-sm text-gray-600 mt-1">Daily at 10:00 AM</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Integrations */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
                                <p className="text-gray-600 mt-1">Connect your accounts (optional)</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Globe className="text-blue-600" size={24} />
                                            <div>
                                                <h4 className="font-medium text-gray-900">Google My Business</h4>
                                                <p className="text-sm text-gray-600">Auto-post and reply to reviews</p>
                                            </div>
                                        </div>
                                        <button className="btn-secondary text-sm">Connect</button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="text-green-600" size={24} />
                                            <div>
                                                <h4 className="font-medium text-gray-900">Google Calendar</h4>
                                                <p className="text-sm text-gray-600">Sync appointments</p>
                                            </div>
                                        </div>
                                        <button className="btn-secondary text-sm">Connect</button>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.calendarId}
                                        onChange={(e) => updateFormData({ calendarId: e.target.value })}
                                        className="input mt-3"
                                        placeholder="Calendar ID (e.g., your@email.com)"
                                    />
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <MessageCircle className="text-green-500" size={24} />
                                            <div>
                                                <h4 className="font-medium text-gray-900">WhatsApp Scheduling</h4>
                                                <p className="text-sm text-gray-600">Let patients book via WhatsApp</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.enableWhatsApp}
                                                onChange={(e) => updateFormData({ enableWhatsApp: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Review & Activate</h2>
                                <p className="text-gray-600 mt-1">Confirm your settings</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900">Profile</h4>
                                    <p className="text-sm text-gray-600">
                                        {formData.name} • {formData.specialty}
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900">Topics</h4>
                                    <p className="text-sm text-gray-600">{formData.topics || 'Not set'}</p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900">Integrations</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Google Calendar: {formData.calendarId ? 'Connected' : 'Not connected'}</li>
                                        <li>• WhatsApp: {formData.enableWhatsApp ? 'Enabled' : 'Disabled'}</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-medium text-green-900">Ready to Activate!</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        Your automations will start running immediately after activation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="btn-secondary disabled:opacity-50"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </button>

                        {currentStep < steps.length ? (
                            <button onClick={nextStep} className="btn-primary">
                                Next
                                <ArrowRight size={18} className="ml-2" />
                            </button>
                        ) : (
                            <button onClick={handleComplete} disabled={loading} className="btn-primary">
                                {loading ? 'Activating...' : 'Activate Automations'}
                                <CheckCircle size={18} className="ml-2" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;