// ==============================
// Maraakiz — Domain Types
// ==============================

/**
 * Le GENRE de compte, pas le pouvoir.
 *
 * « admin » est le compte historique de l'établissement d'origine ;
 * « staff » ouvre l'espace de travail ; « student » l'espace élève.
 * Ce qu'une personne a le droit de faire vient de son APPARTENANCE à un
 * établissement (`institute_members`), jamais de cette valeur seule.
 * Ce commentaire fait foi.
 */
export type UserRole = "admin" | "student" | "staff";

export type Track = "nourania" | "quran_accompaniment";

export type ArabicReadingLevel = "debutant" | "intermediaire" | "avance";

export type SessionType = "individual" | "group";

export type PackStatus = "active" | "completed" | "cancelled";

export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export type PaymentMethod = "paypal" | "bank_transfer" | "cash" | "other";

export type PaymentStatus = "pending" | "received" | "failed" | "refunded";

export type ResourceType = "pdf" | "video" | "audio" | "link" | "slide";

export type SessionResourceType =
  | "replay_video"
  | "slide"
  | "summary"
  | "exercise"
  | "link";

export type ResourceVisibility = "all" | "participants_only";

// ==============================
// Entities
// ==============================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface StudentProfile {
  id: string;
  userId: string;
  whatsappPhone?: string;
  localPhone?: string;
  paypalAddress?: string;
  arabicReadingLevel: ArabicReadingLevel;
  previousExperience?: string;
  track: Track;
  trackStartDate?: Date;
  trackEndDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pack {
  id: string;
  studentId: string;
  track: Track;
  sessionType: SessionType;
  totalSessions: number;
  weeklyRhythm: number;
  priceCents: number;
  status: PackStatus;
  startedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Session {
  id: string;
  packId: string;
  sessionNumber: number;
  scheduledAt: Date;
  durationMinutes: number;
  status: SessionStatus;
  zoomLink?: string;
  notes?: string;
  homework?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  studentId: string;
  attended: boolean;
}

export interface SessionResource {
  id: string;
  sessionId: string;
  title: string;
  type: SessionResourceType;
  url: string;
  visibleTo: ResourceVisibility;
  createdAt: Date;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  track: Track | "both";
  category?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface Payment {
  id: string;
  packId: string;
  studentId: string;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paypalTxnId?: string;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  track: Track | "both";
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================
// Enriched / joined types
// ==============================

export interface StudentWithProfile extends User {
  profile: StudentProfile;
}

export interface StudentWithDetails extends StudentWithProfile {
  activePack?: Pack;
  completedSessions: number;
  paymentStatus: PaymentStatus;
}

export interface SessionWithParticipants extends Session {
  participants: (SessionParticipant & { studentName: string })[];
  resources: SessionResource[];
}
