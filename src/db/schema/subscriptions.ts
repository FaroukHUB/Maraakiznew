import {
  pgTable,
  uuid,
  integer,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { programs } from "./programs";

// ─── Enums ───────────────────────────────────────────────

export const sessionTypeEnum = pgEnum("session_type", ["individual", "group"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "completed",
  "cancelled",
]);

export const closureReasonEnum = pgEnum("closure_reason", [
  "all_sessions_consumed", // toutes les séances du forfait ont été complétées
  "student_request",       // l'élève a demandé l'arrêt
  "teacher_decision",      // décision de l'enseignante
  "non_payment",           // défaut de paiement
  "expired",               // délai dépassé sans consommation complète
]);

// ─── Table ───────────────────────────────────────────────
// Un forfait de séances acheté par une élève.
// Ex: "Pack de 8 séances — Nourania — Groupe — 60 €"
//
// Règles métier :
//   - Une élève peut avoir plusieurs subscriptions (renouvellement).
//   - Une seule subscription active à la fois par programme.
//   - Les séances (sessions) sont rattachées ici.
//   - Le paiement est lié à la subscription.
//
// Progression :
//   Toujours calculée depuis les sessions : COUNT(sessions WHERE status = 'completed').
//   Pas de champ consumedSessions — la table sessions fait foi.
//
// Fermeture :
//   Le passage active → completed/cancelled se fait explicitement avec
//   closedAt + closureReason. Pas de logique implicite basée sur une date d'expiration.
//   startedAt = date du premier cours. closedAt = date de fermeture métier.

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  programId: uuid("program_id")
    .references(() => programs.id, { onDelete: "restrict" })
    .notNull(),
  sessionType: sessionTypeEnum("session_type").notNull(),
  totalSessions: integer("total_sessions").notNull().default(8),
  weeklyRhythm: integer("weekly_rhythm").notNull().default(2),
  priceCents: integer("price_cents").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closureReason: closureReasonEnum("closure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
