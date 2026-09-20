import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

// ─── Table ───────────────────────────────────────────────
// Réglages de l'institut, en clé/valeur.
//
// Une table clé/valeur plutôt qu'une ligne unique à colonnes : ajouter un
// réglage ne demande alors aucune migration. Le prix à payer est que tout
// est du texte — c'est acceptable pour une poignée de réglages
// d'affichage, ça ne le serait pas pour des données métier.
//
// Ce commentaire fait foi.

export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const SETTING_KEYS = {
  instituteName: "institute_name",
  instituteTagline: "institute_tagline",
  contactEmail: "contact_email",
  whatsappNumber: "whatsapp_number",
  timezone: "institute_timezone",
  themePrimary: "theme_primary",
  themeAccent: "theme_accent",
  heroImage: "hero_image",
  address: "address",
  invoiceFooter: "invoice_footer",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];
