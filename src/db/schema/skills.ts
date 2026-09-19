import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { programs } from "./programs";
import { studentProfiles } from "./student-profiles";
import { sessions } from "./sessions";

// ─── Enums ───────────────────────────────────────────────

export const skillStatusEnum = pgEnum("skill_status", [
  "in_progress", // travaillée, pas encore acquise
  "acquired",    // acquise et validée
]);

// ─── Règle de calcul de la progression ───────────────────
//
// La progression d'une élève sur un programme est TOUJOURS :
//   COUNT(skillProgress WHERE status = 'acquired') / COUNT(skills actives)
//
// Deux conséquences volontaires :
//   1. "in_progress" ne compte pas. Une compétence travaillée mais non
//      validée n'avance pas la progression — sinon le chiffre ment.
//   2. Seules les compétences active = true entrent au dénominateur.
//      Retirer une compétence du référentiel (active = false) ne
//      supprime pas les validations déjà faites : l'historique d'une
//      élève reste intact, seul le dénominateur change.
//
// L'absence de ligne dans skillProgress vaut "non commencée". On ne crée
// pas de ligne par avance : un référentiel de 200 compétences × 50 élèves
// ferait 10 000 lignes vides pour rien.
//
// Ce commentaire fait foi.

export const ACQUIRED_STATUS = "acquired" as const;

// ─── Table ───────────────────────────────────────────────
// Référentiel : les compétences d'un programme, dans l'ordre pédagogique.
//
// unit regroupe les compétences en blocs ("Lettres isolées", "Sukoun").
// C'est un simple libellé, pas une table : les blocs changent souvent et
// ne portent aucune logique.

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id")
    .references(() => programs.id, { onDelete: "cascade" })
    .notNull(),
  unit: varchar("unit", { length: 255 }),
  code: varchar("code", { length: 30 }), // "N1.3", facultatif
  label: varchar("label", { length: 500 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Acquis d'une élève sur une compétence.
//
// sessionId garde la trace de la séance où la compétence a été validée.
// Il est nullable : une validation peut être saisie hors séance, et la
// séance peut être supprimée sans effacer l'acquis (ON DELETE SET NULL).

export const skillProgress = pgTable(
  "skill_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    skillId: uuid("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    status: skillStatusEnum("status").notNull().default("in_progress"),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("skill_progress_unique").on(table.studentProfileId, table.skillId),
  ]
);
