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

// ─── Enums ───────────────────────────────────────────────

export const reportCardStatusEnum = pgEnum("report_card_status", [
  "draft",     // en préparation, invisible pour l'élève
  "published", // remis à l'élève, figé
]);

// ─── Règle du bulletin ───────────────────────────────────
//
// Un bulletin est un CONSTAT DATÉ, pas une vue en direct.
//
// Ses chiffres sont recopiés dans la table au moment de la génération,
// pas recalculés à l'affichage. Sans ça, un bulletin de trimestre remis
// en janvier afficherait d'autres chiffres s'il était rouvert en juin :
// l'élève aurait raison de ne plus faire confiance au document.
//
// Conséquence assumée : un bulletin en brouillon doit être régénéré
// explicitement (refreshReportCard) pour intégrer les évolutions. Un
// bulletin publié n'est plus régénérable du tout.
//
// Ce commentaire fait foi.

export type ProgramProgressSnapshot = {
  programId: string;
  programName: string;
  acquired: number;
  total: number;
  rate: number;
};

// ─── Table ───────────────────────────────────────────────

export const reportCards = pgTable("report_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  periodStart: date("period_start", { mode: "date" }).notNull(),
  periodEnd: date("period_end", { mode: "date" }).notNull(),
  status: reportCardStatusEnum("status").notNull().default("draft"),
  generalComment: text("general_comment"),

  // ── Constat figé à la génération ──
  sessionsCount: integer("sessions_count").notNull().default(0),
  attendanceAttended: integer("attendance_attended").notNull().default(0),
  attendanceMissed: integer("attendance_missed").notNull().default(0),
  attendanceExcused: integer("attendance_excused").notNull().default(0),
  attendanceRate: integer("attendance_rate").notNull().default(0), // pourcentage entier
  skillsAcquired: integer("skills_acquired").notNull().default(0), // total cumulé
  skillsTotal: integer("skills_total").notNull().default(0),
  skillsAcquiredInPeriod: integer("skills_acquired_in_period").notNull().default(0),
  programProgress: jsonb("program_progress")
    .$type<ProgramProgressSnapshot[]>()
    .notNull()
    .default([]),
  memorizedAyahs: integer("memorized_ayahs").notNull().default(0),
  memorizedPortionsInPeriod: integer("memorized_portions_in_period")
    .notNull()
    .default(0),
  reviewsInPeriod: integer("reviews_in_period").notNull().default(0),

  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
