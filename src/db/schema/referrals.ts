import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { prospects } from "./prospects";

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",  // la filleule est prospect
  "earned",   // la filleule s'est inscrite, la récompense est due
  "rewarded", // la récompense a été remise
  "expired",  // la filleule n'a pas donné suite
]);

// ─── Règle du parrainage ─────────────────────────────────
//
// Une récompense n'est acquise qu'à l'INSCRIPTION de la filleule, pas à
// la simple recommandation : sinon le code se distribue sans limite pour
// des demandes qui n'aboutissent jamais.
//
// Le code est porté par la marraine et reste stable : c'est ce qu'elle
// communique. Un parrainage est en revanche créé par filleule, pour
// suivre chaque recommandation séparément.
//
// Ce commentaire fait foi.

export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerProfileId: uuid("referrer_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  prospectId: uuid("prospect_id").references(() => prospects.id, {
    onDelete: "set null",
  }),
  referredProfileId: uuid("referred_profile_id").references(
    () => studentProfiles.id,
    { onDelete: "set null" }
  ),
  status: referralStatusEnum("status").notNull().default("pending"),
  rewardCents: integer("reward_cents").notNull().default(0),
  earnedAt: timestamp("earned_at", { withTimezone: true }),
  rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Code de parrainage lisible : 6 caractères sans ambiguïté visuelle. */
export function generateReferralCode(seed: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[hash % alphabet.length];
    hash = Math.floor(hash / alphabet.length) + seed.charCodeAt(i % seed.length) * 7;
  }
  return code;
}
