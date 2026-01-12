export interface Doctor {
    id: string;
    email: string;
    name: string;
    specialty: string;
    phone: string;
    address: string;
    bio: string;
    topics: string[];
    knowledgeBase: string[];
    socialAccounts: SocialAccounts;
    gmbConfig: GMBConfig;
    calendarConfig: CalendarConfig;
    whatsappConfig: WhatsAppConfig;
    automationSettings: AutomationSettings;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    onboarded: boolean;
    plan: 'free' | 'pro' | 'enterprise';
}

export interface SocialAccounts {
    facebook?: {
        pageId: string;
        accessToken: string;
        connected: boolean;
    };
    instagram?: {
        accountId: string;
        accessToken: string;
        connected: boolean;
    };
    twitter?: {
        userId: string;
        accessToken: string;
        accessSecret: string;
        connected: boolean;
    };
    linkedin?: {
        profileId: string;
        accessToken: string;
        connected: boolean;
    };
}

export interface GMBConfig {
    accountId: string | null;
    locationId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    connected: boolean;
    websiteUrl: string | null;
    autoReplyEnabled: boolean;
    autoPostEnabled: boolean;
}

export interface CalendarConfig {
    calendarId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    connected: boolean;
    workingHours: {
        [key: string]: { start: string; end: string; enabled: boolean };
    };
    slotDuration: number; // minutes
}

export interface WhatsAppConfig {
    enabled: boolean;
    phoneNumber: string | null;
    welcomeMessage: string;
    awayMessage: string;
}

export interface AutomationSettings {
    gmbPostFrequency: 'daily' | 'weekly' | 'biweekly';
    gmbPostTime: string; // HH:mm
    socialPostFrequency: 'daily' | 'weekly' | 'biweekly';
    socialPostTime: string;
    reminderHours: number; // hours before appointment
    nextPostTime: Date | null;
    nextSocialPostTime: Date | null;
}

export interface Post {
    id: string;
    doctorId: string;
    type: 'gmb' | 'facebook' | 'instagram' | 'twitter' | 'linkedin';
    content: string;
    imageUrl: string | null;
    status: 'pending' | 'posted' | 'failed';
    postedAt: Date | null;
    createdAt: Date;
    error: string | null;
}

export interface Appointment {
    id: string;
    doctorId: string;
    patientName: string;
    patientPhone: string;
    appointmentTime: Date;
    duration: number;
    reason: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    reminderSent: boolean;
    source: 'whatsapp' | 'manual' | 'website';
    createdAt: Date;
}

export interface Review {
    id: string;
    doctorId: string;
    reviewId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    reply: string | null;
    repliedAt: Date | null;
    createdAt: Date;
}

export interface LogEntry {
    id: string;
    doctorId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action: string;
    message: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export interface DashboardStats {
    totalPosts: number;
    postsThisMonth: number;
    totalAppointments: number;
    appointmentsThisWeek: number;
    totalReviews: number;
    averageRating: number;
    automationStatus: 'active' | 'paused' | 'error';
}