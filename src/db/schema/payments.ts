import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subscriptions } from "./subscriptions";
import { studentProfiles } from "./student-profiles";

// ─── Enums ───────────────────────────────────────────────

export const paymentMethodEnum = pgEnum("payment_method", [
  "paypal",
  "bank_transfer",
  "cash",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "received",
  "failed",
  "refunded",
]);

// ─── Table ───────────────────────────────────────────────
// Paiement lié à une subscription (forfait).
//
// Double FK : subscriptionId (traçabilité forfait) +
// studentProfileId (historique cross-forfait sans jointure).
//
// externalReference : identifiant externe libre — ID transaction PayPal,
// référence virement, numéro de reçu, etc. Pas contraint à un format.
//
// paidAt : date effective de réception du paiement (peut différer de createdAt
// si le paiement est enregistré manuellement après coup).

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id, { onDelete: "cascade" })
    .notNull(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  amountCents: integer("amount_cents").notNull(),
  method: paymentMethodEnum("method").notNull().default("paypal"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  externalReference: varchar("external_reference", { length: 500 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
