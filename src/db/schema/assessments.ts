import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { studentProfiles, arabicReadingLevelEnum } from "./student-profiles";
import { programs } from "./programs";
import { groups } from "./groups";

// ─── Enums ───────────────────────────────────────────────
//
// Un seul module couvre les quatre formes d'évaluation de l'institut,
// distinguées par leur type. Elles partagent la même mécanique — un
// barème, des notes, un classement — et n'auraient rien gagné à vivre
// dans quatre tables presque identiques.

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "quiz",      // contrôle court en cours de séance
  "exam",      // évaluation de fin de module
  "placement", // test de niveau, à l'entrée ou au passage
  "contest",   // concours, avec classement
]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "draft",     // en préparation
  "published", // les résultats sont visibles par les élèves
]);

// ─── Règle de notation ───────────────────────────────────
//
// La note est un ENTIER de points sur un barème, pas un pourcentage :
// « 17 sur 20 » se saisit tel quel et se relit sans conversion. Le
// pourcentage est dérivé à l'affichage.
//
// Une note ne peut ni être négative, ni dépasser le barème. Un résultat
// absent n'est pas une note de zéro : il n'y a simplement pas de ligne,
// et l'élève apparaît comme non évaluée.
//
// Ce commentaire fait foi.

export const PASSING_THRESHOLD = 50; // pourcentage

export function scorePercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 1000) / 10;
}

// ─── Table ───────────────────────────────────────────────

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: assessmentTypeEnum("type").notNull().default("quiz"),
  status: assessmentStatusEnum("status").notNull().default("draft"),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  description: text("description"),
  maxScore: integer("max_score").notNull().default(20),
  heldOn: timestamp("held_on", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Résultat d'une élève à une évaluation.
//
// resultingLevel ne sert qu'aux tests de niveau : le niveau constaté à
// l'issue du test. Il est consultatif — il ne modifie pas le profil de
// l'élève automatiquement, ce choix reste celui de l'enseignante.

export const assessmentResults = pgTable(
  "assessment_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id")
      .references(() => assessments.id, { onDelete: "cascade" })
      .notNull(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    score: integer("score").notNull(),
    comment: text("comment"),
    resultingLevel: arabicReadingLevelEnum("resulting_level"),
    gradedAt: timestamp("graded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("assessment_results_unique").on(table.assessmentId, table.studentProfileId),
  ]
);
