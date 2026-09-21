import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";
import { users } from "./users";

// ─── Récompenses (étoiles) ───────────────────────────────

export const rewardKindEnum = pgEnum("reward_kind", [
  "hifz_quality",     // Hifz de qualité
  "good_behaviour",   // Bon comportement
  "good_attendance",  // Bonne assiduité
  "bad_behaviour",    // Mauvais comportement — pénalité
  "lateness",         // Retard ou absence — pénalité
]);

export type RewardKind = (typeof rewardKindEnum.enumValues)[number];

/**
 * Ce que vaut chaque motif, en étoiles.
 *
 * ── Règle de l'étoile ──
 *
 * On n'enregistre JAMAIS un total. On empile des événements datés, un
 * par étoile donnée ou retirée, et le total se recalcule à la lecture.
 * Un total stocké se désynchronise à la première erreur de clic et on
 * ne sait plus d'où il vient ; une pile d'événements se relit, se
 * date, et s'explique à l'élève comme au parent.
 *
 * Retirer une étoile n'ajoute pas un événement négatif : cela EFFACE le
 * dernier événement de ce motif — c'est une correction, pas une
 * sanction. Les pénalités, elles, sont des motifs à part entière, qui
 * valent -1.
 *
 * Seul point d'entrée du calcul : `starBalance`. Ce commentaire fait foi.
 */
export const REWARD_POINTS: Record<RewardKind, number> = {
  hifz_quality: 1,
  good_behaviour: 1,
  good_attendance: 1,
  bad_behaviour: -1,
  lateness: -1,
};

export const REWARD_LABELS: Record<RewardKind, string> = {
  hifz_quality: "Hifz de qualité",
  good_behaviour: "Bon comportement",
  good_attendance: "Bonne assiduité",
  bad_behaviour: "Mauvais comportement",
  lateness: "Retard / absence",
};

/** Les motifs qui retirent une étoile, dans l'ordre d'affichage. */
export const PENALTY_KINDS: RewardKind[] = ["bad_behaviour", "lateness"];

/** Les motifs qui en donnent une, dans l'ordre d'affichage. */
export const MERIT_KINDS: RewardKind[] = [
  "hifz_quality",
  "good_behaviour",
  "good_attendance",
];

/**
 * Le total d'étoiles d'une élève.
 *
 * Il peut être négatif : c'est voulu. Ramener un total négatif à zéro
 * effacerait ce que les pénalités disent, et l'enseignante verrait
 * « 0 étoile » aussi bien pour l'élève qui n'a rien fait que pour celle
 * qui accumule les retards.
 */
export function starBalance(
  entries: { kind: RewardKind }[]
): number {
  return entries.reduce((total, entry) => total + REWARD_POINTS[entry.kind], 0);
}

export const studentRewards = pgTable(
  "student_rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    kind: rewardKindEnum("kind").notNull(),
    /** Motif écrit à la main, facultatif : « sourate Al-Mulk sans faute ». */
    reason: text("reason"),
    /** Qui l'a donnée. NULL si le compte a disparu depuis. */
    grantedBy: uuid("granted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("student_rewards_student_idx").on(table.studentProfileId)]
);

// ─── Notes privées de l'enseignante ──────────────────────

/**
 * Les notes privées portées sur une élève.
 *
 * ── Règle de la note privée ──
 *
 * Ces notes ne sont JAMAIS montrées à l'élève. Aucune page de
 * `/student` ne doit les lire : ce qui est écrit ici l'est pour
 * l'équipe, et une note lue par celle qu'elle décrit changerait ce que
 * l'équipe ose y écrire.
 *
 * Elles sont DATÉES et empilées, là où `student_profiles.notes` est un
 * champ unique qu'on réécrit. Les deux coexistent : le champ pour la
 * remarque permanente (« ne peut pas le samedi »), cette table pour le
 * suivi (« a buté sur les règles de Nun sakina »).
 * Ce commentaire fait foi.
 */
export const studentNotes = pgTable(
  "student_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("student_notes_student_idx").on(table.studentProfileId)]
);
