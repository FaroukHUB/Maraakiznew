import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

export const documentTypeEnum = pgEnum("document_type", [
  "contract",     // contrat d'inscription
  "authorization", // autorisation parentale, droit à l'image
  "identity",     // pièce d'identité
  "medical",      // certificat médical
  "other",
]);

// ─── Règle du document ───────────────────────────────────
//
// L'application ne STOCKE pas les fichiers : elle garde un lien vers
// l'endroit où ils se trouvent déjà (Drive, coffre-fort, stockage de
// l'institut). Héberger des pièces d'identité demande un cadre que la
// pièce jointe posée dans un dossier n'offre pas — chiffrement, durée de
// conservation, journal des accès.
//
// Ce que l'application apporte, c'est le SUIVI : qui a signé quoi, quand,
// et ce qui arrive à échéance.
//
// Ce commentaire fait foi.

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  studentProfileId: uuid("student_profile_id").references(
    () => studentProfiles.id,
    { onDelete: "cascade" }
  ),
  title: varchar("title", { length: 255 }).notNull(),
  type: documentTypeEnum("type").notNull().default("other"),
  fileUrl: varchar("file_url", { length: 1000 }),
  signedOn: date("signed_on", { mode: "date" }),
  expiresOn: date("expires_on", { mode: "date" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
