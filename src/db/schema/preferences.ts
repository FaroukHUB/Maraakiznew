import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { DashboardLayout } from "@/lib/dashboard-blocks";

/**
 * Les préférences d'affichage, PAR PERSONNE.
 *
 * ── Pourquoi pas dans les réglages de l'institut ──
 *
 * Le tableau de bord est un plan de travail, pas une identité. Deux
 * enseignantes du même institut ne suivent pas les mêmes choses : l'une
 * veut sa journée seule, l'autre veut aussi les impayés. Ces choix
 * appartiennent donc au compte, pas à l'institut.
 *
 * Les COULEURS, elles, restent dans les réglages de l'institut : c'est
 * son identité, et les élèves la voient aussi.
 * Ce commentaire fait foi.
 *
 * Une ligne absente vaut « tout par défaut ». On n'en crée une qu'au
 * premier choix enregistré.
 */
export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  dashboardLayout: jsonb("dashboard_layout").$type<DashboardLayout | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
