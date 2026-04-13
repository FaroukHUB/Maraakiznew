import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// ─── Table ───────────────────────────────────────────────
// Un programme = un parcours pédagogique (ex: "Nourania", "Accompagnement Coran").
// Table de référence, pas de FK vers users. Permet d'ajouter de nouveaux
// parcours sans modifier le code (pas d'enum figé dans le code).

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 50 }).unique().notNull(), // "nourania", "quran_accompaniment"
  name: varchar("name", { length: 255 }).notNull(), // "Nourania", "Accompagnement Coran"
  description: text("description"),
  defaultSessionCount: integer("default_session_count").notNull().default(8),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
