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
import { staffMembers } from "./staff";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

// ─── Enums ───────────────────────────────────────────────

export const groupStatusEnum = pgEnum("group_status", [
  "active",   // groupe en cours
  "archived", // groupe terminé, conservé pour l'historique
]);

// ─── Table ───────────────────────────────────────────────
// Groupe (classe) d'élèves suivant un même programme.
//
// Un groupe est une couche d'ORGANISATION, pas de facturation :
// il dit qui apprend ensemble. Les forfaits (subscriptions) restent
// individuels, et la consommation des séances reste calculée par
// forfait — voir CONSUMING_STATUSES dans sessions.ts.
//
// Concrètement, un groupe sert à :
//   1. planifier une séance sans re-cocher chaque élève,
//   2. suivre l'assiduité d'une classe entière.
//
// schedule : créneau habituel en texte libre ("Samedi 10h-12h").
// Ce n'est pas une règle de récurrence — la planification reste
// explicite, séance par séance.

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  /**
   * L'enseignante qui tient le groupe.
   *
   * Facultative : un groupe peut exister avant qu'on sache qui le
   * prendra. NULL veut dire « pas encore attribué », pas « personne ».
   */
  staffMemberId: uuid("staff_member_id").references(() => staffMembers.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  level: arabicReadingLevelEnum("level"),
  description: text("description"),
  schedule: varchar("schedule", { length: 255 }),
  capacity: integer("capacity"), // places max, null = illimité
  status: groupStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Appartenance d'une élève à un groupe.
//
// La contrainte d'unicité empêche un double rattachement : une élève
// ne peut figurer qu'une fois dans un groupe donné. Elle peut en
// revanche appartenir à plusieurs groupes (Nourania + Coran).

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("group_members_unique").on(table.groupId, table.studentProfileId)]
);
