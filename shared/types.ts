// /shared/types.ts
// ALL shared TypeScript interfaces for the CEISD Member App.
// Every agent imports from this file. NEVER redefine these locally.
// Agent 1 owns this file — other agents may ONLY append new interfaces, never modify existing ones.

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export enum UserRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

export enum YearOfStudy {
  FRESHMAN = 'FRESHMAN',
  SOPHOMORE = 'SOPHOMORE',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  GRADUATE = 'GRADUATE',
}

export enum AttendanceMethod {
  QR = 'QR',
  MANUAL = 'MANUAL',
}

export enum TaskType {
  WORKSHOP = 'WORKSHOP',
  FORM = 'FORM',
  SUBMISSION = 'SUBMISSION',
  MEETING = 'MEETING',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export enum CompletionMethod {
  AUTO_ATTENDANCE = 'AUTO_ATTENDANCE',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
  MANUAL_APPROVAL = 'MANUAL_APPROVAL',
}

export enum StageType {
  SPARK = 'SPARK',
  SHAPE = 'SHAPE',
  SCALE = 'SCALE',
  MENTOR = 'MENTOR',
}

export enum MatchStatus {
  PENDING = 'PENDING',     // suggested, nobody acted
  REQUESTED = 'REQUESTED', // one side sent an invitation
  CONNECTED = 'CONNECTED', // accepted
  SAVED = 'SAVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  MATCH_REQUEST = 'MATCH_REQUEST',
  MATCH_ACCEPTED = 'MATCH_ACCEPTED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  EVENT_REMINDER = 'EVENT_REMINDER',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MENTOR_BOOKING = 'MENTOR_BOOKING',
  POINTS_AWARDED = 'POINTS_AWARDED',
  SYSTEM = 'SYSTEM',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  college?: string;
  yearOfStudy?: YearOfStudy;
  graduationYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRating {
  skill: string;
  rating: number; // 1–5
}

export interface UserProfile {
  id: string;
  userId: string;
  skillRatings: SkillRating[];
  motivation: {
    whyJoining: string[];       // multi-select, max 2
    currentStage: string;       // single-select
  };
  problemInterests: {
    industries: string[];       // multi-select, max 3
    currentProblem?: string;    // textarea if working on a problem
  };
  founderSignals: {
    pastExperiences: string[];  // multi-select
    timeCommitment: string;     // single-select
    riskTolerance: string;      // single-select
  };
  collaborationPrefs: {
    lookingFor: string;         // single-select
    seeking: string[];          // multi-select
    teamStyle: string;          // single-select
    workStyle: string;          // single-select
  };
  engagementPrefs: {
    preferredTypes: string[];   // multi-select
    communicationChannels: string[]; // multi-select
  };
  aiProfileAnswers: {
    frustration: string;        // Section 8 Q1
    buildIfNoFailure: string;   // Section 8 Q2
    skillsToGain: string;       // Section 8 Q3
    idealPeople: string;        // Section 8 Q4
  };
  commitmentScore: number;      // 1–10 slider
  needsEmbedding: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// SIGNUP FORM (9 sections)
// ─────────────────────────────────────────────

export interface SignupFormSection1 {
  email: string;
  name: string;
  phone: string;
  college: string;
  yearOfStudy: YearOfStudy;
  graduationYear: number;
}

export interface SignupFormSection2 {
  whyJoining: string[];   // multi-select, max 2
  currentStage: string;   // single-select
}

export interface SignupFormSection3 {
  skillRatings: SkillRating[];
  preferredRoles: string[]; // multi-select, max 3
}

export interface SignupFormSection4 {
  industries: string[];       // multi-select, max 3
  workingOnProblem: boolean;
  currentProblem?: string;
}

export interface SignupFormSection5 {
  pastExperiences: string[];
  timeCommitment: string;
  riskTolerance: string;
}

export interface SignupFormSection6 {
  lookingFor: string;
  seeking: string[];
  teamStyle: string;
  workStyle: string;
}

export interface SignupFormSection7 {
  preferredEngagementTypes: string[];
  communicationChannels: string[];
}

export interface SignupFormSection8 {
  frustration: string;
  buildIfNoFailure: string;
  skillsToGain: string;
  idealPeople: string;
}

export interface SignupFormSection9 {
  commitmentScore: number; // 1–10
}

export interface SignupFormData {
  section1: SignupFormSection1;
  section2: SignupFormSection2;
  section3: SignupFormSection3;
  section4: SignupFormSection4;
  section5: SignupFormSection5;
  section6: SignupFormSection6;
  section7: SignupFormSection7;
  section8: SignupFormSection8;
  section9: SignupFormSection9;
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerImage?: string;
  dateTime: string;
  location: string;
  totalSeats: number;
  rsvpCount: number;
  speakerName?: string;
  speakerRole?: string;
  speakerAvatar?: string;
  pointsForAttendance: number;
  createdById: string;
  createdBy?: Partial<User>;
  createdAt: string;
  updatedAt: string;
  hasRsvp?: boolean; // injected client-side
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  userId: string;
  attendedAt: string;
  method: AttendanceMethod;
}

// ─────────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  categoryTag: string;
  description: string;
  ctaLabel: string;
  ctaUrl?: string;
  createdById: string;
  createdBy?: Partial<User>;
  createdAt: string;
  updatedAt: string;
}

export interface NoticePost {
  id: string;
  title: string;
  description: string;
  tags: string[];
  skillLabels: string[];
  projectCategory?: string;
  authorId: string;
  author?: Partial<User>;
  isPinned: boolean;
  isFlagged: boolean;
  openToMatches: boolean;
  createdAt: string;
  editDeadline: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// TASKS & FORMS
// ─────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  assignedToUserId?: string;
  assignedToRole?: UserRole;
  assignedToAll: boolean;
  deadline: string;
  status: TaskStatus;
  completionMethod: CompletionMethod;
  linkedEventId?: string;
  linkedEvent?: Partial<Event>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completion?: TaskCompletion; // injected for current user
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: string;
  method: CompletionMethod;
  approvedById?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'rating' | 'file' | 'slider';
  required: boolean;
  options?: string[];       // for select / multiselect
  min?: number;             // for slider / rating
  max?: number;
  placeholder?: string;
}

export interface FormSchema {
  fields: FormField[];
}

export interface Form {
  id: string;
  title: string;
  schema: FormSchema;
  assignedToUserId?: string;
  assignedToRole?: UserRole;
  assignedToAll: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  submission?: FormSubmission; // injected for current user
}

export interface FormSubmission {
  id: string;
  formId: string;
  userId: string;
  answers: Record<string, unknown>;
  submittedAt: string;
}

// ─────────────────────────────────────────────
// GAMIFICATION
// ─────────────────────────────────────────────

export interface GamificationRecord {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface UserStage {
  id: string;
  userId: string;
  stage: StageType;
  totalPoints: number;
  updatedAt: string;
}

export interface StageInfo {
  stage: StageType;
  totalPoints: number;
  nextStage: StageType | null;
  pointsToNext: number | null;
  engagementLevel: string;
}

// ─────────────────────────────────────────────
// MATCHING
// ─────────────────────────────────────────────

export interface Match {
  id: string;
  userId1: string;
  user1?: Partial<User> & { profile?: Partial<UserProfile> };
  userId2: string;
  user2?: Partial<User> & { profile?: Partial<UserProfile> };
  compatibilityScore: number;
  explanation: string;
  status: MatchStatus;
  requestedById?: string | null;
  requestedAt?: string | null;
  connectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Injected by GET /api/matching/my-matches so the UI never reasons about userId1/userId2
  other?: Partial<User> & { profile?: Partial<UserProfile>; userStage?: { stage: StageType; totalPoints: number } | null };
  iRequested?: boolean;
  awaitingMyResponse?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    matchId?: string;
    eventId?: string;
    taskId?: string;
    fromUserId?: string;
    withUserId?: string;
    points?: number;
    completedTaskIds?: string[];
  } | null;
  readAt?: string | null;
  createdAt: string;
}

export interface MentorBooking {
  id: string;
  mentorId: string;
  mentor?: Partial<User>;
  memberId: string;
  member?: Partial<User>;
  requestedAt: string;
  scheduledAt?: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

export interface AdminLog {
  id: string;
  adminId: string;
  admin?: Partial<User>;
  action: string;
  targetId: string;
  targetType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// API UTILITIES
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
