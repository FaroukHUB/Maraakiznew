import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

// ─── Enums ───────────────────────────────────────────────

export const sessionResourceTypeEnum = pgEnum("session_resource_type", [
  "replay_video",
  "slide",
  "summary",
  "exercise",
  "link",
]);

export const resourceVisibilityEnum = pgEnum("resource_visibility", [
  "all",
  "participants_only",
]);

// ─── Table ───────────────────────────────────────────────
// Notes pédagogiques d'une séance.
// Séparée de sessions pour 3 raisons :
//   1. Une session peut exister avant d'avoir des notes (planifiée).
//   2. Les notes sont riches (contenu, arrêt, devoirs) — pas un simple champ texte.
//   3. Permet d'évoluer vers un historique de notes si besoin.
//
// stopReference : "Qaida Nourania, page 12, ligne 5" — arrêt exact dans le support.

export const sessionNotes = pgTable("session_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  content: text("content"), // ce qui a été vu / travaillé
  stopReference: varchar("stop_reference", { length: 500 }), // arrêt exact dans le support
  homework: text("homework"), // devoirs à faire
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Ressources attachées à une séance (replay, diapo, synthèse, exercice).
// visibleTo : "all" = toutes les élèves, "participants_only" = celles qui étaient là.

export const sessionResources = pgTable("session_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: sessionResourceTypeEnum("type").notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  visibleTo: resourceVisibilityEnum("visible_to").notNull().default("participants_only"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
