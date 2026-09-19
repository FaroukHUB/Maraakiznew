import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subscriptions } from "./subscriptions";
import { studentProfiles } from "./student-profiles";
import { groups } from "./groups";

// ─── Enums ───────────────────────────────────────────────

export const sessionStatusEnum = pgEnum("session_status", [
  "planned",          // séance planifiée, pas encore tenue
  "completed",        // séance effectuée normalement
  "cancelled",        // séance annulée (ni prof ni élève responsable)
  "student_absent",   // l'élève était absente
  "teacher_absent",   // l'enseignante était absente
]);

// ─── Règle de consommation du forfait ────────────────────
//
// Le compteur de séances consommées est TOUJOURS calculé depuis cette table.
// Formule : COUNT(sessions WHERE subscriptionId = X AND status IN consumingStatuses)
//
// Statuts qui CONSOMMENT une séance du forfait :
//   - completed        → cours effectué, consommé
//   - student_absent   → l'élève n'est pas venue, la séance est perdue
//
// Statuts qui NE CONSOMMENT PAS :
//   - planned          → pas encore passée
//   - cancelled        → annulation neutre, on replanifie
//   - teacher_absent   → la prof n'a pas assuré, l'élève ne perd pas sa séance
//
// Ce commentaire fait foi. Toute query de progression doit utiliser
// ces deux statuts et rien d'autre.

export const CONSUMING_STATUSES = ["completed", "student_absent"] as const;

// ─── Consommation d'une séance de GROUPE ─────────────────
//
// Une séance de groupe réunit plusieurs élèves, chacune avec son propre
// forfait. La règle ci-dessus ne débite que le forfait porteur de la
// séance (sessions.subscriptionId). Les autres participantes sont
// débitées via sessionParticipants.subscriptionId.
//
// Statuts de présence qui CONSOMMENT une séance du forfait :
//   - present / late → elle a eu son cours
//   - absent         → elle n'est pas venue sans prévenir, séance perdue.
//                      C'est l'exact équivalent de student_absent.
//
// Statut qui NE CONSOMME PAS :
//   - excused → absence prévenue à l'avance. Même logique que
//     teacher_absent : ce qui est annoncé ne fait pas perdre la séance.
//     RÈGLE MÉTIER : si l'institut veut décompter les absences excusées,
//     il suffit d'ajouter "excused" à cette constante, et rien d'autre.
//
// Le forfait porteur n'est jamais compté deux fois : la requête exclut
// les participations dont le forfait est celui de la séance.
//
// Ce commentaire fait foi. Toute query de consommation doit passer par
// getConsumedSessionCount().

export const CONSUMING_ATTENDANCE_STATUSES = ["present", "late", "absent"] as const;

// ─── Table ───────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id, { onDelete: "cascade" })
    .notNull(),
  sessionNumber: integer("session_number").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: sessionStatusEnum("status").notNull().default("planned"),
  // Séance de groupe : sert à pré-remplir les participantes et à
  // rattacher la séance à une classe. N'affecte pas la consommation
  // du forfait, qui reste individuelle (voir CONSUMING_STATUSES).
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  zoomLink: varchar("zoom_link", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Table ───────────────────────────────────────────────
// Participants d'une séance (nécessaire pour les cours de groupe).
//
// attendanceStatus : présence granulaire par participante.
//   - present   → elle était là
//   - absent    → elle n'était pas là
//   - late      → arrivée en retard (mais a participé)
//   - excused   → absence prévenue à l'avance
//
// hasReplayAccess : droit de visionner le replay de cette séance.
//   Par défaut true pour toutes les participantes inscrites,
//   même les absentes (elles rattrapent via le replay).

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);

// ─── Règle de calcul de l'assiduité ──────────────────────
//
// Le taux d'assiduité est TOUJOURS calculé depuis attendanceStatus.
// Formule : (present + late) / (present + late + absent)
//
// Statuts qui comptent comme une PRÉSENCE :
//   - present → elle était là
//   - late    → arrivée en retard, mais elle a suivi la séance
//
// Statuts qui comptent comme une ABSENCE :
//   - absent  → elle n'est pas venue, sans prévenir
//
// Statut EXCLU du calcul :
//   - excused → absence prévenue à l'avance. Elle ne pénalise pas
//     l'élève, exactement comme teacher_absent ne consomme pas de
//     séance. On la compte et on l'affiche, mais hors du taux.
//
// Ce commentaire fait foi. Toute query d'assiduité doit utiliser
// ces trois constantes et rien d'autre.

export const ATTENDED_STATUSES = ["present", "late"] as const;
export const MISSED_STATUSES = ["absent"] as const;
export const RATED_STATUSES = ["present", "late", "absent"] as const;

export const sessionParticipants = pgTable("session_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  studentProfileId: uuid("student_profile_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  attendanceStatus: attendanceStatusEnum("attendance_status")
    .notNull()
    .default("present"),
  hasReplayAccess: boolean("has_replay_access").notNull().default(true),
  // Forfait débité pour CETTE participante.
  //
  // Nullable : les participations enregistrées avant l'introduction de la
  // consommation collective n'en ont pas, et ne débitent donc rien — le
  // comportement historique est préservé tel quel.
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
});
