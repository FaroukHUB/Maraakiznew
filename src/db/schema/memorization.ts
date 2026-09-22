import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { sessions } from "./sessions";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

// ─── Enums ───────────────────────────────────────────────

export const reviewQualityEnum = pgEnum("review_quality", [
  "weak",   // récitation hésitante, à reprendre de zéro
  "ok",     // récitation correcte, quelques reprises
  "strong", // récitation fluide et sûre
]);

// ─── Règle de planification des révisions ────────────────
//
// Répétition espacée : plus une portion est récitée avec sûreté, plus
// l'intervalle avant la révision suivante s'allonge.
//
//   strong → on passe à l'intervalle suivant
//   ok     → on reste sur le même intervalle
//   weak   → on repart du premier intervalle
//
// nextReviewAt = date de la révision + REVIEW_INTERVALS_DAYS[intervalIndex]
//
// Les deux champs intervalIndex et nextReviewAt sont stockés plutôt que
// recalculés : la question « qu'est-ce qui est à réviser aujourd'hui ? »
// doit rester une requête simple sur une colonne indexée, pas un parcours
// de tout l'historique.
//
// Ce commentaire fait foi.

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 120] as const;

/** Rang d'intervalle suivant, selon la qualité de la récitation. */
export function nextIntervalIndex(
  current: number,
  quality: "weak" | "ok" | "strong"
): number {
  if (quality === "weak") return 0;
  if (quality === "ok") return Math.min(current, REVIEW_INTERVALS_DAYS.length - 1);
  return Math.min(current + 1, REVIEW_INTERVALS_DAYS.length - 1);
}

/** Date de la prochaine révision, à partir d'une date et d'un rang. */
export function computeNextReview(from: Date, intervalIndex: number): Date {
  const days = REVIEW_INTERVALS_DAYS[
    Math.min(Math.max(intervalIndex, 0), REVIEW_INTERVALS_DAYS.length - 1)
  ];
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

// ─── Table ───────────────────────────────────────────────
// Une portion du Coran mémorisée par une élève.
//
// La portion est bornée par (sourate, verset de début, verset de fin) plutôt
// que par un texte libre : c'est ce qui permet de trier, de regrouper et de
// mesurer le volume mémorisé.

export const memorizationItems = pgTable("memorization_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  surahNumber: integer("surah_number").notNull(),
  ayahStart: integer("ayah_start").notNull(),
  ayahEnd: integer("ayah_end").notNull(),
  memorizedAt: timestamp("memorized_at", { withTimezone: true }).defaultNow().notNull(),
  intervalIndex: integer("interval_index").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Historique des révisions d'une portion.
//
// On garde chaque passage, pas seulement le dernier : c'est ce qui permet
// de voir si une portion résiste ou si elle décroche régulièrement.

export const memorizationReviews = pgTable("memorization_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  itemId: uuid("item_id")
    .references(() => memorizationItems.id, { onDelete: "cascade" })
    .notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
  quality: reviewQualityEnum("quality").notNull(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
});
