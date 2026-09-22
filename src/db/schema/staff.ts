import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { institutes, DEFAULT_INSTITUTE_ID } from "./institutes";

// ─── Enums ───────────────────────────────────────────────

export const staffRoleEnum = pgEnum("staff_role", [
  "teacher",           // enseignante
  "secretary",         // secrétariat
  "supervisor",        // superviseure
  "pedagogical_lead",  // responsable pédagogique
  "manager",           // gestionnaire
]);

export const staffStatusEnum = pgEnum("staff_status", ["active", "inactive"]);

export const payrollStatusEnum = pgEnum("payroll_status", ["draft", "paid"]);

// ─── Règle de rémunération ───────────────────────────────
//
// Deux modes, exclusifs l'un de l'autre :
//   - à l'heure   : le montant se calcule depuis les séances données
//   - au forfait  : un montant mensuel fixe, indépendant du volume
//
// Un membre qui n'a ni l'un ni l'autre n'est pas rémunéré par
// l'application — c'est un cas légitime (bénévolat, statut externe), pas
// une donnée manquante.
//
// Un bulletin de paie payé est FIGÉ : son montant est recopié, il ne se
// recalcule plus si le tarif change ensuite. Même principe que la facture.
//
// Ce commentaire fait foi.

export const staffMembers = pgTable("staff_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
  // Un membre peut exister sans compte de connexion : l'institut suit des
  // personnes, pas seulement des utilisatrices de l'application.
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  supervisorId: uuid("supervisor_id"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: staffRoleEnum("role").notNull().default("teacher"),
  status: staffStatusEnum("status").notNull().default("active"),
  hourlyRateCents: integer("hourly_rate_cents"),
  monthlyRateCents: integer("monthly_rate_cents"),
  hiredOn: date("hired_on", { mode: "date" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payrollEntries = pgTable(
  "payroll_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
  /** L'établissement propriétaire. Voir `schema/institutes.ts`. */
  instituteId: uuid("institute_id")
    .references(() => institutes.id, { onDelete: "cascade" })
    .notNull()
    .default(DEFAULT_INSTITUTE_ID),
    staffMemberId: uuid("staff_member_id")
      .references(() => staffMembers.id, { onDelete: "cascade" })
      .notNull(),
    period: varchar("period", { length: 7 }).notNull(), // "2026-09"
    status: payrollStatusEnum("status").notNull().default("draft"),
    sessionsCount: integer("sessions_count").notNull().default(0),
    minutesWorked: integer("minutes_worked").notNull().default(0),
    amountCents: integer("amount_cents").notNull().default(0),
    notes: text("notes"),
    paidOn: date("paid_on", { mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("payroll_period_unique").on(table.staffMemberId, table.period)]
);
