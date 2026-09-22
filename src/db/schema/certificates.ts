import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { programs } from "./programs";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

export const certificateStatusEnum = pgEnum("certificate_status", [
  "draft",
  "issued",
  "revoked",
]);

export const mentionEnum = pgEnum("certificate_mention", [
  "passable",
  "bien",
  "tres_bien",
  "excellent",
]);

// ─── Règle du diplôme ────────────────────────────────────
//
// Même principe que le bulletin, en plus strict : un diplôme délivré est
// un document nominatif qui atteste d'un niveau atteint à une date. Ses
// éléments justificatifs sont recopiés au moment de la délivrance.
//
// Un diplôme ne se supprime JAMAIS. Une erreur se corrige en le révoquant
// avec un motif : un diplôme qui disparaît sans trace est pire qu'un
// diplôme erroné, parce qu'il ne laisse rien à expliquer.
//
// La RÉFÉRENCE est unique et attribuée à la délivrance, comme le numéro
// d'une facture. Elle permet de vérifier l'authenticité d'un document
// présenté ailleurs.
//
// Ce commentaire fait foi.

export type CertificateBasis = {
  skillsAcquired: number;
  skillsTotal: number;
  progressRate: number;
  assessmentAverage: number | null;
  attendanceRate: number | null;
  memorizedAyahs: number;
  sessionsCompleted: number;
};

export const MENTION_THRESHOLDS: { mention: string; min: number }[] = [
  { mention: "excellent", min: 90 },
  { mention: "tres_bien", min: 80 },
  { mention: "bien", min: 65 },
  { mention: "passable", min: 0 },
];

/** Mention déduite d'un pourcentage global. */
export function mentionForScore(score: number): string {
  return MENTION_THRESHOLDS.find((t) => score >= t.min)?.mention ?? "passable";
}

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  reference: varchar("reference", { length: 30 }).unique(),
  title: varchar("title", { length: 255 }).notNull(),
  status: certificateStatusEnum("status").notNull().default("draft"),
  mention: mentionEnum("mention"),
  overallScore: integer("overall_score").notNull().default(0),
  basis: jsonb("basis").$type<CertificateBasis | null>(),
  comment: text("comment"),
  issuedOn: date("issued_on", { mode: "date" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revocationReason: text("revocation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
