import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subscriptions } from "./subscriptions";
import { studentProfiles } from "./student-profiles";

// ─── Enums ───────────────────────────────────────────────

export const sessionStatusEnum = pgEnum("session_status", [
  "planned",          // séance planifiée, pas encore tenue
  "completed",        // séance effectuée normalement
  "cancelled",        // séance annulée (ni prof ni élève responsable)
  "student_absent",   // l'élève était absente
  "teacher_absent",   // l'enseignante était absente
]);

// ─── Règle de consommation du forfait ────────────────────
//
// Le compteur de séances consommées est TOUJOURS calculé depuis cette table.
// Formule : COUNT(sessions WHERE subscriptionId = X AND status IN consumingStatuses)
//
// Statuts qui CONSOMMENT une séance du forfait :
//   - completed        → cours effectué, consommé
//   - student_absent   → l'élève n'est pas venue, la séance est perdue
//
// Statuts qui NE CONSOMMENT PAS :
//   - planned          → pas encore passée
//   - cancelled        → annulation neutre, on replanifie
//   - teacher_absent   → la prof n'a pas assuré, l'élève ne perd pas sa séance
//
// Ce commentaire fait foi. Toute query de progression doit utiliser
// ces deux statuts et rien d'autre.

export const CONSUMING_STATUSES = ["completed", "student_absent"] as const;

// ─── Table ───────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id, { onDelete: "cascade" })
    .notNull(),
  sessionNumber: integer("session_number").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: sessionStatusEnum("status").notNull().default("planned"),
  zoomLink: varchar("zoom_link", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Participants d'une séance (nécessaire pour les cours de groupe).
//
// attendanceStatus : présence granulaire par participante.
//   - present   → elle était là
//   - absent    → elle n'était pas là
//   - late      → arrivée en retard (mais a participé)
//   - excused   → absence prévenue à l'avance
//
// hasReplayAccess : droit de visionner le replay de cette séance.
//   Par défaut true pour toutes les participantes inscrites,
//   même les absentes (elles rattrapent via le replay).

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);

export const sessionParticipants = pgTable("session_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  attendanceStatus: attendanceStatusEnum("attendance_status")
    .notNull()
    .default("present"),
  hasReplayAccess: boolean("has_replay_access").notNull().default(true),
});
