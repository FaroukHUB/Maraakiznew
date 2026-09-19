import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { subscriptions } from "./subscriptions";
import { payments } from "./payments";

// ─── Enums ───────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",     // en préparation, modifiable, sans numéro définitif
  "issued",    // émise et remise à l'élève
  "paid",      // réglée
  "cancelled", // annulée — jamais supprimée
]);

// ─── Règle de la facture ─────────────────────────────────
//
// Une facture émise est un document comptable : elle ne se supprime pas
// et ses montants ne bougent plus. Seuls deux chemins existent après
// émission : constater le paiement, ou annuler.
//
// Le NUMÉRO n'est attribué qu'à l'émission, et il est séquentiel par
// année (2026-0001, 2026-0002…). Un brouillon n'a pas de numéro : sinon,
// supprimer un brouillon créerait un trou dans la numérotation, ce que la
// comptabilité n'admet pas.
//
// Les LIGNES sont recopiées dans la facture, pas référencées. Si le tarif
// d'un forfait change après émission, la facture déjà émise garde le
// montant facturé. Même raison que pour les bulletins : un document remis
// ne se réécrit pas.
//
// Ce commentaire fait foi.

export type InvoiceLine = {
  label: string;
  quantity: number;
  unitPriceCents: number;
};

// ─── Table ───────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  paymentId: uuid("payment_id").references(() => payments.id, {
    onDelete: "set null",
  }),

  // Numéro séquentiel, attribué à l'émission. Null tant que brouillon.
  number: varchar("number", { length: 20 }).unique(),
  status: invoiceStatusEnum("status").notNull().default("draft"),

  issueDate: date("issue_date", { mode: "date" }),
  dueDate: date("due_date", { mode: "date" }),

  lines: jsonb("lines").$type<InvoiceLine[]>().notNull().default([]),
  totalCents: integer("total_cents").notNull().default(0),

  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Total d'un jeu de lignes, en centimes. */
export function computeInvoiceTotal(lines: InvoiceLine[]): number {
  return lines.reduce(
    (sum, line) => sum + Math.round(line.quantity * line.unitPriceCents),
    0
  );
}
