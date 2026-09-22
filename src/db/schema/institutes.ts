import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
  unique,
  primaryKey,
  integer,
  customType,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * L'ÉTABLISSEMENT : la frontière de toutes les données.
 *
 * ── Ce que cette table change ──
 *
 * Maraakiz sert plusieurs instituts et plusieurs professeurs
 * indépendants sur une seule application et une seule base. Rien ne les
 * sépare tant qu'une frontière n'est pas posée : une élève, un groupe,
 * une facture appartiennent à UN établissement, et personne d'un autre
 * établissement ne doit pouvoir les lire, les modifier ni les
 * télécharger.
 *
 * La colonne `institute_id` est donc portée par CHAQUE table métier,
 * même celles qu'on pourrait rattacher par une jointure. Une jointure
 * se contourne par erreur ; une colonne filtrée à la racine de chaque
 * requête, non. Le filtrage passe par un point d'entrée unique —
 * `requireInstitute` dans `lib/tenant.ts` — et un script vérifie qu'il
 * est présent partout.
 *
 * ── Pourquoi NOT NULL avec une valeur par défaut ──
 *
 * L'ancienne production écrit dans la même base sans connaître cette
 * colonne. Une colonne nullable l'aurait laissée créer des lignes
 * orphelines, invisibles de partout. Avec une valeur par défaut, ses
 * écritures atterrissent dans l'établissement d'origine, et rien ne se
 * perd. Ce commentaire fait foi.
 */
export const instituteStatusEnum = pgEnum("institute_status", [
  "active",
  "suspended",
]);

export const institutes = pgTable("institutes", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Identifiant lisible, utilisé dans les adresses publiques. */
  slug: varchar("slug", { length: 80 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: instituteStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * L'établissement d'origine : celui qui existait avant le cloisonnement.
 *
 * Son identifiant est FIXE et écrit dans la migration : c'est la valeur
 * par défaut de toutes les colonnes `institute_id`, donc celle que
 * l'ancienne production utilisera sans le savoir. Ne jamais la changer.
 */
export const DEFAULT_INSTITUTE_ID = "00000000-0000-4000-8000-000000000001";

// ─── Appartenances et permissions ────────────────────────

/**
 * Les rôles dans un établissement.
 *
 * Ils ne remplacent PAS `users.role`, qui dit seulement de quel genre de
 * compte il s'agit. Ils disent ce qu'une personne peut faire DANS un
 * établissement donné : la même personne peut diriger le sien et
 * intervenir chez une consœur.
 */
export const instituteRoleEnum = pgEnum("institute_role", [
  "owner",     // professeur indépendant, ou direction de l'institut
  "manager",   // gestion complète, sauf les membres
  "teacher",   // enseignement : ses groupes, ses séances, son assiduité
  "assistant", // appui : pointage et comptes rendus
]);

/**
 * Les capacités, nommées une fois pour toutes.
 *
 * Une capacité décrit un POUVOIR, pas un écran : « tenir les comptes »
 * plutôt que « voir la page des factures ». Un écran peut changer de
 * nom, se scinder ou disparaître ; le pouvoir, lui, reste le même, et
 * c'est lui que l'on accorde à quelqu'un. Ce commentaire fait foi.
 */
export const CAPABILITIES = {
  instituteManage: "institute.manage",   // réglages, identité, membres
  studentsManage: "students.manage",     // élèves, prospects, documents
  groupsManage: "groups.manage",         // groupes et programmes
  sessionsManage: "sessions.manage",     // planning, séances, comptes rendus
  attendanceManage: "attendance.manage", // pointage et assiduité
  financeManage: "finance.manage",       // paiements, factures, paie
  contentManage: "content.manage",       // actualités, ressources, cours, boutique
  reportsView: "reports.view",           // tableaux de bord et bilans
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export const ALL_CAPABILITIES: Capability[] = Object.values(CAPABILITIES);

/**
 * Ce que chaque rôle donne, par défaut.
 *
 * Un membre peut recevoir des capacités EN PLUS de son rôle
 * (`capabilities`), jamais moins : retirer un pouvoir à quelqu'un se
 * fait en changeant son rôle, ce qui reste lisible dans l'écran des
 * membres. Seul point d'entrée du calcul : `capabilitiesOf`.
 */
export const ROLE_CAPABILITIES: Record<
  (typeof instituteRoleEnum.enumValues)[number],
  Capability[]
> = {
  owner: ALL_CAPABILITIES,
  manager: ALL_CAPABILITIES.filter((c) => c !== CAPABILITIES.instituteManage),
  teacher: [
    CAPABILITIES.studentsManage,
    CAPABILITIES.groupsManage,
    CAPABILITIES.sessionsManage,
    CAPABILITIES.attendanceManage,
    CAPABILITIES.contentManage,
    CAPABILITIES.reportsView,
  ],
  assistant: [
    CAPABILITIES.sessionsManage,
    CAPABILITIES.attendanceManage,
    CAPABILITIES.reportsView,
  ],
};

export const instituteMembers = pgTable(
  "institute_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instituteId: uuid("institute_id")
      .references(() => institutes.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: instituteRoleEnum("role").notNull().default("teacher"),
    /** Capacités accordées en plus du rôle. */
    capabilities: jsonb("capabilities").$type<Capability[]>().notNull().default([]),
    status: instituteStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("institute_members_unique").on(table.instituteId, table.userId)]
);

/** Les capacités effectives d'un membre : son rôle, plus ses ajouts. */
export function capabilitiesOf(member: {
  role: (typeof instituteRoleEnum.enumValues)[number];
  capabilities: Capability[];
}): Capability[] {
  return [...new Set([...ROLE_CAPABILITIES[member.role], ...member.capabilities])];
}

/**
 * LE CLOISONNEMENT EST TENU PAR LA BASE, pas seulement par le code.
 *
 * Chaque table métier porte `institute_id`, et chaque lien métier porte
 * une clé étrangère COMPOSÉE `(institute_id, colonne)` vers son parent
 * — 52 au total, posées par `drizzle/0011_cloisonnement_par_la_base.sql`.
 *
 * Pourquoi : une requête qui oublie l'établissement se relit ; une
 * insertion qui rattache une ligne au parent d'un AUTRE institut, elle,
 * ne se voit nulle part. La ligne est créée chez qui écrit, elle pointe
 * seulement ailleurs. L'essai à deux établissements l'a produit pour de
 * vrai : une note privée de B accrochée à une élève de A.
 *
 * Avec ces clés, le cas n'est plus « refusé par une vérification » : il
 * est impossible, pour tout chemin d'écriture présent ou futur. Une
 * nouvelle table métier doit donc ajouter sa colonne `institute_id`, son
 * `UNIQUE (institute_id, id)` si elle sert de parent, et la clé composée
 * de chacun de ses liens. Ce commentaire fait foi.
 */

// ─── Réglages par établissement ──────────────────────────

/**
 * Les réglages, désormais par établissement.
 *
 * ── Pourquoi une table de plus, et pas une colonne sur `settings` ──
 *
 * `settings` a pour clé primaire la seule colonne `key` : deux
 * établissements ne peuvent pas y avoir chacun leur `institute_name`.
 * Changer cette clé primaire demanderait de la SUPPRIMER puis de la
 * recréer — destructif, interdit ici, et surtout l'ancienne production
 * lit encore cette table. On la laisse donc intacte : elle reste la
 * mémoire de l'établissement d'origine, et `getSettings` s'y replie
 * quand la nouvelle table n'a rien. Ce commentaire fait foi.
 */
export const instituteSettings = pgTable(
  "institute_settings",
  {
    instituteId: uuid("institute_id")
      .references(() => institutes.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    value: text("value"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.instituteId, table.key] })]
);

// ─── Images par établissement ────────────────────────────

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Le bandeau et le logo, par établissement.
 *
 * Même raison que pour les réglages : `institute_assets` a pour clé
 * primaire la seule colonne `key`. La table d'origine reste servie en
 * repli pour l'établissement historique.
 */
export const instituteImages = pgTable(
  "institute_images",
  {
    instituteId: uuid("institute_id")
      .references(() => institutes.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 40 }).notNull(),
    mimeType: varchar("mime_type", { length: 60 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    data: bytea("data").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.instituteId, table.key] })]
);
