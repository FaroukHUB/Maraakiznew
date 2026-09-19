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
import { studentProfiles } from "./student-profiles";
import { programs } from "./programs";

export const courseStatusEnum = pgEnum("course_status", ["draft", "published"]);

export const lessonTypeEnum = pgEnum("lesson_type", [
  "video",
  "audio",
  "text",
  "exercise",
]);

// ─── Règle du cours interactif ───────────────────────────
//
// Un cours interactif est un parcours EN AUTONOMIE : l'élève avance
// seule, à son rythme, entre les séances. Ce n'est pas une séance — il ne
// consomme aucun forfait et n'entre ni dans l'assiduité ni dans la paie.
//
// La progression se mesure aux leçons TERMINÉES, pas ouvertes : ouvrir
// une vidéo ne veut pas dire l'avoir suivie.
//
// Ce commentaire fait foi.

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: courseStatusEnum("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: lessonTypeEnum("type").notNull().default("video"),
  contentUrl: varchar("content_url", { length: 1000 }),
  content: text("content"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .references(() => lessons.id, { onDelete: "cascade" })
      .notNull(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("lesson_progress_unique").on(table.lessonId, table.studentProfileId)]
);
