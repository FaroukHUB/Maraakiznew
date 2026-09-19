import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

// ─── Table ───────────────────────────────────────────────
// Article publié aux élèves : annonce de l'institut, conseil, rappel.
//
// Le slug sert d'adresse lisible et se déduit du titre. Il est unique :
// deux articles au même titre doivent être distingués à la main, plutôt
// que de laisser l'application inventer « mon-article-2 » en silence.
//
// pinned remonte un article en tête de liste, indépendamment de sa date.
// C'est fait pour les annonces qui doivent rester visibles (dates de
// rentrée, fermeture pour les fêtes), pas pour trier par importance.

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  category: varchar("category", { length: 100 }),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  status: postStatusEnum("status").notNull().default("draft"),
  pinned: boolean("pinned").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Slug lisible à partir d'un titre : accents retirés, espaces en tirets. */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
