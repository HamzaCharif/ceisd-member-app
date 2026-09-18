// /shared/constants.ts
// Shared constants for the CEISD Member App.
// Any agent may APPEND new entries. No agent may modify existing entries.
// Import these constants instead of hardcoding values anywhere in the codebase.

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const AUS_EMAIL_DOMAIN = 'aus.edu';

// ─────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────

export const API_ENDPOINTS = {
  // Auth
  AUTH_SSO: '/api/auth/sso',
  AUTH_COMPLETE_PROFILE: '/api/auth/complete-profile',
  AUTH_SESSION_VALIDATE: '/api/auth/session/validate',
  AUTH_ME: '/api/auth/me',

  // Content
  ANNOUNCEMENTS: '/api/content/announcements',
  EVENTS: '/api/content/events',
  EVENTS_RSVP: (id: string) => `/api/content/events/${id}/rsvp`,
  NOTICEBOARD_POSTS: '/api/content/noticeboard/posts',
  NOTICEBOARD_POST: (id: string) => `/api/content/noticeboard/posts/${id}`,
  NOTICEBOARD_PIN: (id: string) => `/api/content/noticeboard/posts/${id}/pin`,
  NOTICEBOARD_FLAG: (id: string) => `/api/content/noticeboard/posts/${id}/flag`,
  NOTICEBOARD_REPORT: (id: string) => `/api/content/noticeboard/posts/${id}/report`,

  // Tasks
  MY_TASKS: '/api/tasks/my-tasks',
  TASK: (id: string) => `/api/tasks/${id}`,
  TASK_COMPLETE: (id: string) => `/api/tasks/${id}/complete`,
  TASK_COMPLETE_BY_ATTENDANCE: '/api/tasks/complete-by-attendance',

  // Forms
  MY_FORMS: '/api/tasks/forms/my-forms',
  FORM: (id: string) => `/api/tasks/forms/${id}`,
  FORM_SUBMIT: (id: string) => `/api/tasks/forms/${id}/submit`,

  // Attendance
  ATTENDANCE_LOG: '/api/attendance/log',
  ATTENDANCE_MANUAL: '/api/attendance/manual',
  ATTENDANCE_QR: (eventId: string) => `/api/attendance/qr/${eventId}`,

  // Gamification
  GAMIFICATION_POINTS: '/api/gamification/points',
  GAMIFICATION_MY_STAGE: '/api/gamification/my-stage',
  GAMIFICATION_LEADERBOARD: '/api/gamification/leaderboard',

  // Matching
  MATCHING_GENERATE: '/api/matching/generate-matches',
  MATCHING_MY_MATCHES: '/api/matching/my-matches',
  MATCHING_MATCH: (id: string) => `/api/matching/matches/${id}`,
  MATCHING_GENERATE_EMBEDDING: '/api/matching/generate-embedding',
  MATCHING_RECOMMEND_MENTOR: '/api/matching/recommend-mentor',
  MATCHING_BOOK_MENTOR: '/api/matching/book-mentor',
  MATCHING_RANKED_EVENTS: '/api/matching/ranked-events',
  MATCHING_LOG_EVENT: '/api/matching/log-event',
  MATCHING_SUGGESTIONS: '/api/matching/suggestions',
  MATCHING_REQUESTS: '/api/matching/requests',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',
  NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',
  NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,

  // Admin
  ADMIN_MEMBERS: '/api/admin/members',
  ADMIN_MEMBER: (id: string) => `/api/admin/members/${id}`,
  ADMIN_MEMBER_ROLE: (id: string) => `/api/admin/members/${id}/role`,
  ADMIN_ANALYTICS_OVERVIEW: '/api/admin/analytics/overview',
  ADMIN_ANALYTICS_EVENTS: '/api/admin/analytics/events-over-time',
  ADMIN_ANALYTICS_SKILLS: '/api/admin/analytics/skill-distribution',
  ADMIN_ANALYTICS_ENGAGEMENT: '/api/admin/analytics/engagement-by-stage',
  ADMIN_ANALYTICS_EVENTS_DETAIL: '/api/admin/analytics/events',
  ADMIN_ANALYTICS_TOP_MEMBERS: '/api/admin/analytics/top-members',
  ADMIN_EXPORT_CSV: '/api/admin/export/csv',
  ADMIN_EXPORT_PDF: '/api/admin/export/pdf',
  ADMIN_AI_INSIGHTS: '/api/admin/ai-insights',
} as const;

// ─────────────────────────────────────────────
// GAMIFICATION POINT VALUES
// ─────────────────────────────────────────────

export const POINT_VALUES = {
  ATTENDANCE: 50,
  TASK_MANDATORY: 30,
  TASK_RECOMMENDED: 15,
  NOTICE_POST: 10,
  MATCH_ACCEPTED: 20,
  FORM_SUBMITTED: 15,
} as const;

export type PointReason = keyof typeof POINT_VALUES;

// ─────────────────────────────────────────────
// JOURNEY STAGE THRESHOLDS
// ─────────────────────────────────────────────

export const STAGE_THRESHOLDS = {
  SPARK: 0,
  SHAPE: 200,
  SCALE: 500,
  MENTOR: 1000,
} as const;

export const STAGE_LABELS: Record<string, string> = {
  SPARK: 'Explorer',
  SHAPE: 'Builder',
  SCALE: 'Collaborator',
  MENTOR: 'Mentor',
};

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────

export const COLORS = {
  primary: '#1D9E75',
  primaryDark: '#157A5A',
  primaryLight: '#E8F7F2',
  navy: '#1A2744',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  cardBackground: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  success: '#1D9E75',
  border: '#E5E7EB',
  stageLocked: '#D1D5DB',
} as const;

export const TASK_TYPE_COLORS: Record<string, string> = {
  WORKSHOP: '#7F77DD',
  FORM: '#378ADD',
  SUBMISSION: '#EF9F27',
  MEETING: '#D85A30',
};

export const STAGE_COLORS: Record<string, string> = {
  SPARK: '#6B7280',
  SHAPE: '#378ADD',
  SCALE: '#1D9E75',
  MENTOR: '#F59E0B',
};

// ─────────────────────────────────────────────
// SIGNUP FORM OPTIONS
// ─────────────────────────────────────────────

export const SKILLS_LIST = [
  'Business/Strategy',
  'Technical/Engineering',
  'AI/Data',
  'Design/UX',
  'Marketing/Growth',
  'Media & Content',
  'Programming',
  'Finance',
  'Operations',
  'Research/Analysis',
  'Communication/Pitching',
] as const;

export const TEAM_ROLES = [
  'Founder',
  'Co-Founder',
  'Technical Lead',
  'Product Lead',
  'Marketing Lead',
  'Operations Lead',
  'Advisor',
  'Contributor',
] as const;

export const INDUSTRY_INTERESTS = [
  'FinTech',
  'HealthTech',
  'EdTech',
  'SustainaTech',
  'AI/ML',
  'E-Commerce',
  'Social Impact',
  'Gaming',
  'Real Estate',
  'Logistics',
  'Other',
] as const;

export const WHY_JOINING_OPTIONS = [
  'Build a startup',
  'Find co-founders',
  'Learn entrepreneurship',
  'Network with peers',
  'Explore ideas',
  'Support others',
] as const;

export const CURRENT_STAGE_OPTIONS = [
  'I have an idea',
  'I am exploring',
  'I have a team',
  'I have a prototype',
  'I am already building',
  'I want to support others',
] as const;

export const PAST_EXPERIENCES = [
  'Founded a company',
  'Built a product',
  'Participated in a hackathon',
  'Completed an internship',
  'Led a student project',
  'Freelanced or consulted',
] as const;

export const TIME_COMMITMENTS = [
  '1–3 hours/week',
  '4–7 hours/week',
  '8–15 hours/week',
  '15+ hours/week',
] as const;

export const RISK_TOLERANCE_OPTIONS = [
  'Low — I prefer stability',
  'Medium — Open to calculated risks',
  'High — I embrace uncertainty',
] as const;

export const LOOKING_FOR_OPTIONS = [
  'Looking for teammates',
  'Open to joining a team',
  'Both',
] as const;

export const SEEKING_OPTIONS = [
  'Technical co-founder',
  'Business co-founder',
  'Designer',
  'Mentor',
  'Advisor',
] as const;

export const TEAM_STYLE_OPTIONS = [
  'Small and focused',
  'Large and diverse',
  'Flexible',
] as const;

export const WORK_STYLE_OPTIONS = [
  'In-person',
  'Remote',
  'Hybrid',
  'Flexible',
] as const;

export const ENGAGEMENT_TYPES = [
  'Workshops',
  'Hackathons',
  'Networking events',
  'Mentorship sessions',
  'Speaker talks',
  'Online discussions',
  'Project showcases',
] as const;

export const COMMUNICATION_CHANNELS = [
  'WhatsApp',
  'Email',
  'Discord',
  'In-person',
] as const;
