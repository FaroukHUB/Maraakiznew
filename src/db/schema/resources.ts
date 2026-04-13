import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { programs } from "./programs";

// ─── Enums ───────────────────────────────────────────────

export const resourceTypeEnum = pgEnum("resource_type", [
  "pdf",
  "video",
  "audio",
  "link",
  "slide",
]);

// ─── Table ───────────────────────────────────────────────
// Bibliothèque de ressources globales (Qaida Nourania, Juz Amma, etc.).
// Pas liées à une séance — ce sont les supports de référence.
//
// programId nullable : null = ressource commune à tous les programmes.

export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: resourceTypeEnum("type").notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  category: varchar("category", { length: 100 }), // "Qaida Nourania", "Juz Amma", etc.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
