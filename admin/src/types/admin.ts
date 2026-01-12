import { Timestamp } from 'firebase/firestore';

// ==================== ADMIN USER ====================
export interface AdminUser {
    uid: string;
    email: string;
    displayName: string;
    role: 'super_admin' | 'admin' | 'support' | 'viewer';
    permissions: AdminPermissions;
    lastLogin: Date;
    createdAt: Date;
}

export interface AdminPermissions {
    doctors: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        impersonate: boolean;
    };
    workflows: {
        view: boolean;
        edit: boolean;
        trigger: boolean;
        pause: boolean;
    };
    logs: {
        view: boolean;
        export: boolean;
        delete: boolean;
    };
    settings: {
        view: boolean;
        edit: boolean;
    };
    analytics: {
        view: boolean;
        export: boolean;
    };
    system: {
        view: boolean;
        manage: boolean;
    };
}

// ==================== DOCTOR (Extended for Admin) ====================
export interface DoctorAdmin {
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
    // Admin-specific fields
    status: 'active' | 'suspended' | 'pending' | 'deleted';
    suspensionReason?: string;
    notes: AdminNote[];
    tags: string[];
    assignedAdmin?: string;
    lastActivityAt?: Timestamp;
    stats: DoctorStats;
}

export interface AdminNote {
    id: string;
    adminId: string;
    adminName: string;
    content: string;
    createdAt: Timestamp;
}

export interface DoctorStats {
    totalPosts: number;
    postsThisMonth: number;
    totalAppointments: number;
    appointmentsThisMonth: number;
    totalReviews: number;
    averageRating: number;
    automationSuccessRate: number;
    lastPostDate?: Timestamp;
    lastAppointmentDate?: Timestamp;
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
    lastSyncAt?: Timestamp;
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
    lastSyncAt?: Timestamp;
}

export interface CalendarConfig {
    calendarId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    connected: boolean;
    workingHours: Record<string, WorkingHour>;
    slotDuration: number;
    lastSyncAt?: Timestamp;
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
    lastMessageAt?: Timestamp;
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

// ==================== WORKFLOWS ====================
export interface Workflow {
    id: string;
    name: string;
    description: string;
    type: 'gmb_post' | 'social_post' | 'review_reply' | 'reminder' | 'whatsapp' | 'custom';
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    config: WorkflowConfig;
    status: 'active' | 'paused' | 'disabled' | 'error';
    lastRunAt?: Timestamp;
    nextRunAt?: Timestamp;
    stats: WorkflowStats;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

export interface WorkflowTrigger {
    type: 'cron' | 'event' | 'webhook' | 'manual';
    schedule?: string; // Cron expression
    event?: string; // Firestore event
    webhookUrl?: string;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: 'query' | 'generate' | 'api_call' | 'condition' | 'transform' | 'notify';
    config: Record<string, any>;
    onError: 'stop' | 'continue' | 'retry';
    retryCount?: number;
}

export interface WorkflowConfig {
    batchSize: number;
    timeout: number; // seconds
    retryPolicy: {
        maxRetries: number;
        backoffMs: number;
    };
    notifications: {
        onSuccess: boolean;
        onFailure: boolean;
        recipients: string[];
    };
}

export interface WorkflowStats {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageDuration: number; // ms
    lastError?: string;
    doctorsProcessed: number;
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: Timestamp;
    completedAt?: Timestamp;
    duration?: number;
    doctorsProcessed: number;
    successCount: number;
    failureCount: number;
    errors: WorkflowError[];
    logs: WorkflowLog[];
}

export interface WorkflowError {
    doctorId: string;
    step: string;
    message: string;
    timestamp: Timestamp;
}

export interface WorkflowLog {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: Timestamp;
    metadata?: Record<string, any>;
}

// ==================== LOGS ====================
export interface SystemLog {
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    source: 'function' | 'api' | 'webhook' | 'scheduler' | 'admin' | 'system';
    action: string;
    message: string;
    doctorId?: string;
    adminId?: string;
    workflowId?: string;
    metadata?: Record<string, any>;
    stackTrace?: string;
    ip?: string;
    userAgent?: string;
    createdAt: Timestamp;
}

export interface AuditLog {
    id: string;
    adminId: string;
    adminEmail: string;
    action: string;
    resource: 'doctor' | 'workflow' | 'settings' | 'api_key' | 'admin';
    resourceId: string;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    ip: string;
    userAgent: string;
    createdAt: Timestamp;
}

// ==================== ANALYTICS ====================
export interface AnalyticsOverview {
    totalDoctors: number;
    activeDoctors: number;
    newDoctorsThisMonth: number;
    totalPosts: number;
    postsThisMonth: number;
    totalAppointments: number;
    appointmentsThisMonth: number;
    automationSuccessRate: number;
    apiUsage: APIUsage;
    revenueMetrics: RevenueMetrics;
}

export interface APIUsage {
    openai: { calls: number; tokens: number; cost: number };
    replicate: { calls: number; cost: number };
    twilio: { messages: number; cost: number };
    gmb: { calls: number };
}

export interface RevenueMetrics {
    mrr: number;
    arr: number;
    churnRate: number;
    planDistribution: {
        free: number;
        pro: number;
        enterprise: number;
    };
}

export interface TimeSeriesData {
    date: string;
    value: number;
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
    }[];
}

// ==================== SYSTEM ====================
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    services: ServiceHealth[];
    lastCheckedAt: Timestamp;
}

export interface ServiceHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    lastError?: string;
    lastCheckedAt: Timestamp;
}

export interface SystemSettings {
    general: {
        appName: string;
        supportEmail: string;
        maintenanceMode: boolean;
        maintenanceMessage?: string;
    };
    automation: {
        globalPause: boolean;
        defaultBatchSize: number;
        maxRetries: number;
        rateLimits: {
            postsPerHour: number;
            apiCallsPerMinute: number;
        };
    };
    notifications: {
        adminEmails: string[];
        slackWebhook?: string;
        alertThresholds: {
            errorRate: number;
            failedJobs: number;
        };
    };
    security: {
        sessionTimeout: number;
        maxLoginAttempts: number;
        ipWhitelist: string[];
    };
}

export interface APIKey {
    id: string;
    name: string;
    service: 'openai' | 'twilio' | 'replicate' | 'google' | 'meta';
    keyPreview: string; // First/last 4 chars
    status: 'active' | 'expired' | 'revoked';
    usageLimit?: number;
    usageCount: number;
    lastUsedAt?: Timestamp;
    expiresAt?: Timestamp;
    createdAt: Timestamp;
    createdBy: string;
}

// ==================== FILTERS & PAGINATION ====================
export interface DoctorFilters {
    search?: string;
    status?: DoctorAdmin['status'];
    plan?: DoctorAdmin['plan'];
    onboarded?: boolean;
    active?: boolean;
    hasGMB?: boolean;
    hasWhatsApp?: boolean;
    tags?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export interface LogFilters {
    level?: SystemLog['level'];
    source?: SystemLog['source'];
    doctorId?: string;
    workflowId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    search?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}