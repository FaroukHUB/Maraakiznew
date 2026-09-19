import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";

export const shopItemStatusEnum = pgEnum("shop_item_status", [
  "available",
  "out_of_stock",
  "archived",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",   // commande passée, pas encore réglée
  "paid",      // réglée
  "delivered", // remise à l'élève
  "cancelled",
]);

// ─── Règle de la boutique ────────────────────────────────
//
// L'application ne PREND PAS de paiement en ligne : elle enregistre une
// commande et son règlement, constaté par l'institut. Brancher un
// encaissement demande un prestataire, des conditions de vente et une
// politique de remboursement — ce n'est pas une case à cocher.
//
// Le stock est décrémenté à la COMMANDE, pas au règlement : c'est la
// réservation qui immobilise l'exemplaire. Une commande annulée le rend.
//
// Les lignes sont recopiées dans la commande, prix compris : changer le
// prix d'un article ne réécrit pas les commandes passées.
//
// Ce commentaire fait foi.

export type OrderLine = {
  itemId: string;
  label: string;
  quantity: number;
  unitPriceCents: number;
};

export const shopItems = pgTable("shop_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull().default(0),
  stock: integer("stock"), // null = stock non suivi
  status: shopItemStatusEnum("status").notNull().default("available"),
  imageUrl: varchar("image_url", { length: 1000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  lines: jsonb("lines").$type<OrderLine[]>().notNull().default([]),
  totalCents: integer("total_cents").notNull().default(0),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
