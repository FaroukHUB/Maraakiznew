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
  /**
   * Adresse postale.
   *
   * Le PAYS est le champ qui compte : c'est lui qui donne le fuseau
   * horaire (voir `lib/countries.ts`). Le reste sert aux documents et au
   * contact. Tout est facultatif — une élève peut s'inscrire sans donner
   * son adresse. Ce commentaire fait foi.
   */
  addressLine: varchar("address_line", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  city: varchar("city", { length: 120 }),
  /** Code ISO à deux lettres, « FR », « DZ »… */
  country: varchar("country", { length: 2 }),
  /**
   * Fuseau horaire de l'élève, au format IANA (« America/Montreal »).
   *
   * NULL veut dire « celui de l'institut ». C'est le cas courant — la
   * plupart des élèves sont dans le même pays — et cela évite d'avoir à
   * ressaisir le fuseau à chaque inscription. Une valeur n'est posée que
   * lorsqu'elle DIFFÈRE. Ce commentaire fait foi.
   */
  timezone: varchar("timezone", { length: 64 }),
  arabicReadingLevel: arabicReadingLevelEnum("arabic_reading_level").notNull(),
  previousExperience: text("previous_experience"),
  notes: text("notes"), // notes privées de l'admin sur l'élève
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
