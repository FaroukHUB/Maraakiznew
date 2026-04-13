import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// ─── Enums ───────────────────────────────────────────────

export const arabicReadingLevelEnum = pgEnum("arabic_reading_level", [
  "debutant",
  "intermediaire",
  "avance",
]);

// ─── Table ───────────────────────────────────────────────
// Profil pédagogique d'une élève. Séparé de users pour garder
// la table users légère (auth) et le profil riche (métier).

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  whatsappPhone: varchar("whatsapp_phone", { length: 20 }),
  localPhone: varchar("local_phone", { length: 20 }),
  paypalAddress: varchar("paypal_address", { length: 255 }),
  arabicReadingLevel: arabicReadingLevelEnum("arabic_reading_level").notNull(),
  previousExperience: text("previous_experience"),
  notes: text("notes"), // notes privées de l'admin sur l'élève
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
