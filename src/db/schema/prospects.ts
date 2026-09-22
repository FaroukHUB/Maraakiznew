import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles, arabicReadingLevelEnum } from "./student-profiles";
import { programs } from "./programs";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

// ─── Enums ───────────────────────────────────────────────

export const prospectStatusEnum = pgEnum("prospect_status", [
  "new",             // demande reçue, pas encore traitée
  "contacted",       // premier échange fait
  "trial_scheduled", // un rendez-vous ou cours d'essai est posé
  "converted",       // devenue élève
  "lost",            // n'a pas donné suite
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "done",
  "cancelled",
  "no_show", // ne s'est pas présentée
]);

// ─── Règle du prospect ───────────────────────────────────
//
// Un prospect n'est PAS une élève : il n'a ni compte, ni forfait, ni
// séance. Il vit dans sa propre table jusqu'à sa conversion, qui crée
// alors l'utilisatrice et son profil.
//
// La conversion est à SENS UNIQUE et laisse une trace : le prospect
// n'est pas supprimé, il passe en « converted » et garde le lien vers le
// profil créé. C'est ce qui permet de savoir d'où vient chaque élève.
//
// Ce commentaire fait foi.

export const prospects = pgTable("prospects", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }), // bouche-à-oreille, Instagram, site...
  status: prospectStatusEnum("status").notNull().default("new"),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  declaredLevel: arabicReadingLevelEnum("declared_level"),
  notes: text("notes"),
  lostReason: text("lost_reason"),
  convertedStudentProfileId: uuid("converted_student_profile_id").references(
    () => studentProfiles.id,
    { onDelete: "set null" }
  ),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Rendez-vous : entretien de découverte, cours d'essai, point de suivi.
//
// Il se rattache SOIT à un prospect, SOIT à une élève — jamais aux deux,
// jamais à aucun des deux. Ce n'est pas une séance : il ne consomme pas
// de forfait et n'entre pas dans l'assiduité.

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  prospectId: uuid("prospect_id").references(() => prospects.id, {
    onDelete: "cascade",
  }),
  studentProfileId: uuid("student_profile_id").references(() => studentProfiles.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  meetingLink: varchar("meeting_link", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
