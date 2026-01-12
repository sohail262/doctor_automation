import { Timestamp } from 'firebase-admin/firestore';

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
    createdAt: Timestamp;
    updatedAt: Timestamp;
    active: boolean;
    onboarded: boolean;
    plan: 'free' | 'pro' | 'enterprise';
}

export interface SocialAccounts {
    facebook?: SocialAccount;
    instagram?: SocialAccount;
    twitter?: SocialAccount;
    linkedin?: SocialAccount;
}

export interface SocialAccount {
    accountId?: string;
    pageId?: string;
    userId?: string;
    profileId?: string;
    accessToken: string;
    accessSecret?: string;
    connected: boolean;
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
    workingHours: Record<string, WorkingHour>;
    slotDuration: number;
}

export interface WorkingHour {
    start: string;
    end: string;
    enabled: boolean;
}

export interface WhatsAppConfig {
    enabled: boolean;
    phoneNumber: string | null;
    welcomeMessage: string;
    awayMessage: string;
}

export interface AutomationSettings {
    gmbPostFrequency: 'daily' | 'weekly' | 'biweekly';
    gmbPostTime: string;
    socialPostFrequency: 'daily' | 'weekly' | 'biweekly';
    socialPostTime: string;
    reminderHours: number;
    nextPostTime: Timestamp | null;
    nextSocialPostTime: Timestamp | null;
}

export interface Post {
    id?: string;
    doctorId: string;
    type: 'gmb' | 'facebook' | 'instagram' | 'twitter' | 'linkedin';
    content: string;
    imageUrl: string | null;
    status: 'pending' | 'posted' | 'failed';
    postedAt: Timestamp | null;
    createdAt: Timestamp;
    error: string | null;
}

export interface Appointment {
    id?: string;
    doctorId: string;
    patientName: string;
    patientPhone: string;
    appointmentTime: Timestamp;
    duration: number;
    reason: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    reminderSent: boolean;
    source: 'whatsapp' | 'manual' | 'website';
    createdAt: Timestamp;
}

export interface LogEntry {
    id?: string;
    doctorId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action: string;
    message: string;
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
}

export interface GeneratedContent {
    text: string;
    imageUrl: string | null;
    topic: string;
}