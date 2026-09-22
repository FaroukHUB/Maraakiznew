import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

// ─── Enums ───────────────────────────────────────────────

export const arabicReadingLevelEnum = pgEnum("arabic_reading_level", [
  "debutant",
  "intermediaire",
  "avance",
]);

/**
 * L'état d'une élève dans l'institut.
 *
 * ── Suspendre n'est pas supprimer ──
 *
 * Une élève suspendue garde tout : ses forfaits, ses séances, ses
 * paiements, sa mémorisation. Elle ne compte simplement plus dans les
 * effectifs et n'apparaît plus dans les listes de planification. C'est
 * l'état qu'on utilise pour une pause, un impayé, un départ — et c'est
 * réversible d'un clic.
 *
 * Supprimer, à l'inverse, efface l'historique comptable en cascade :
 * `deleteStudent` le refuse dès qu'un paiement existe.
 * Ce commentaire fait foi.
 */
export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "suspended",
]);

// ─── Table ───────────────────────────────────────────────
// Profil pédagogique d'une élève. Séparé de users pour garder
// la table users légère (auth) et le profil riche (métier).

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
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
  /**
   * Date de naissance, facultative. Elle ne sert qu'à afficher un âge :
   * une élève peut s'inscrire sans la donner, et l'âge s'efface alors
   * au lieu d'afficher un nombre inventé.
   */
  birthDate: date("birth_date", { mode: "string" }),
  status: studentStatusEnum("status").notNull().default("active"),
  arabicReadingLevel: arabicReadingLevelEnum("arabic_reading_level").notNull(),
  previousExperience: text("previous_experience"),
  notes: text("notes"), // notes privées de l'admin sur l'élève
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
