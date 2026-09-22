import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { requireInstitute } from "@/lib/tenant";
import { monthKey } from "@/lib/datetime";
import {
  sessions,
  sessionParticipants,
  studentProfiles,
  users,
  groups,
  staffMembers,
  ATTENDED_STATUSES,
  MISSED_STATUSES,
} from "@/db/schema";

// ─── Types ───────────────────────────────────────────────

export type AttendanceStats = {
  attended: number; // présente + en retard
  missed: number; // absente
  excused: number; // absence prévenue, hors taux
  rated: number; // total pris en compte dans le taux
  rate: number; // pourcentage arrondi à 1 décimale
};

export type StudentAttendance = AttendanceStats & {
  studentProfileId: string;
  studentName: string;
};

type Filters = {
  groupId?: string;
  staffMemberId?: string;
  month?: string; // "2026-04"
  from?: Date; // borne incluse
  to?: Date; // borne incluse
};

// ─── Helpers ─────────────────────────────────────────────

/**
 * Conditions communes à toute query d'assiduité.
 *
 * Seules les séances déjà passées et non annulées comptent : une
 * séance à venir ne doit pas faire chuter le taux, et une séance
 * annulée n'est la faute de personne.
 */
function attendanceConditions(institute: string, filters: Filters = {}) {
  // L'établissement est un PARAMÈTRE exigé, pas une option : toutes les
  // requêtes de ce fichier joignent `sessions` et passent par ici, donc
  // toutes héritent du cloisonnement. Ce commentaire fait foi.
  const conditions = [
    eq(sessions.instituteId, institute),
    lt(sessions.scheduledAt, new Date()),
    sql`${sessions.status} <> 'cancelled'`,
  ];

  if (filters.groupId) {
    conditions.push(eq(sessions.groupId, filters.groupId));
  }
  if (filters.staffMemberId) {
    conditions.push(eq(sessions.staffMemberId, filters.staffMemberId));
  }
  if (filters.month) {
    conditions.push(sql`to_char(${sessions.scheduledAt}, 'YYYY-MM') = ${filters.month}`);
  }
  if (filters.from) {
    conditions.push(gte(sessions.scheduledAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(sessions.scheduledAt, filters.to));
  }

  return and(...conditions);
}

function buildStats(row: { attended: number; missed: number; excused: number }): AttendanceStats {
  const attended = Number(row.attended ?? 0);
  const missed = Number(row.missed ?? 0);
  const excused = Number(row.excused ?? 0);
  const rated = attended + missed;

  return {
    attended,
    missed,
    excused,
    rated,
    rate: rated > 0 ? Math.round((attended / rated) * 1000) / 10 : 0,
  };
}

const countedColumns = {
  attended: sql<number>`count(*) filter (where ${sessionParticipants.attendanceStatus} in ${ATTENDED_STATUSES})`,
  missed: sql<number>`count(*) filter (where ${sessionParticipants.attendanceStatus} in ${MISSED_STATUSES})`,
  excused: sql<number>`count(*) filter (where ${sessionParticipants.attendanceStatus} = 'excused')`,
};

// ─── Queries ─────────────────────────────────────────────

/** Assiduité globale, optionnellement filtrée par groupe et/ou par mois. */
export async function getAttendanceStats(filters: Filters = {}): Promise<AttendanceStats> {
  const institute = await requireInstitute();
  const [row] = await db
    .select(countedColumns)
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(attendanceConditions(institute, filters));

  return buildStats(row ?? { attended: 0, missed: 0, excused: 0 });
}

/**
 * Assiduité élève par élève, de la plus faible à la plus élevée.
 *
 * L'ordre met en tête les élèves à relancer. Les élèves sans aucune
 * séance comptabilisée sont écartées : un taux de 0 % sans séance
 * ne veut rien dire.
 */
export async function getAttendanceByStudent(
  filters: Filters = {}
): Promise<StudentAttendance[]> {
  const institute = await requireInstitute();
  const rows = await db
    .select({
      studentProfileId: studentProfiles.id,
      studentName: users.name,
      ...countedColumns,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .innerJoin(
      studentProfiles,
      eq(studentProfiles.id, sessionParticipants.studentProfileId)
    )
    .innerJoin(users, eq(users.id, studentProfiles.userId))
    .where(attendanceConditions(institute, filters))
    .groupBy(studentProfiles.id, users.name);

  return rows
    .map((row) => ({
      studentProfileId: row.studentProfileId,
      studentName: row.studentName,
      ...buildStats(row),
    }))
    .filter((student) => student.rated > 0 || student.excused > 0)
    .sort((a, b) => a.rate - b.rate || b.missed - a.missed);
}

/** Assiduité d'une seule élève. */
export async function getAttendanceForStudent(
  studentProfileId: string,
  filters: Filters = {}
): Promise<AttendanceStats> {
  const institute = await requireInstitute();
  const [row] = await db
    .select(countedColumns)
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(
      and(
        attendanceConditions(institute, filters),
        eq(sessionParticipants.studentProfileId, studentProfileId)
      )
    );

  return buildStats(row ?? { attended: 0, missed: 0, excused: 0 });
}

/**
 * Séances passées qui attendent encore quelque chose.
 *
 * ── Une seule définition de « à traiter » ──
 *
 * Trois cas, et le même compte partout dans l'application — la liste des
 * séances comme l'écran d'assiduité. Deux définitions voisines donnaient
 * deux nombres différents sur deux écrans qui se renvoient l'un à
 * l'autre : « 24 séances à traiter » menait à une liste qui en montrait
 * 34. Ce commentaire fait foi.
 *
 *   1. la séance est passée mais toujours « planifiée » — son issue n'a
 *      pas été tranchée, et elle ne compte pas dans le taux ;
 *   2. aucune participante n'est enregistrée — l'appel n'a pas été fait,
 *      et elle ne compte pas non plus ;
 *   3. elle est terminée mais sans compte rendu — le taux, lui, est bon ;
 *      c'est le suivi pédagogique qui manque.
 */
export async function getSessionsNeedingAttendance() {
  const institute = await requireInstitute();
  const rows = await db.query.sessions.findMany({
    where: and(
      eq(sessions.instituteId, institute),
      lt(sessions.scheduledAt, new Date()),
      sql`${sessions.status} <> 'cancelled'`
    ),
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    with: {
      group: true,
      participants: true,
      notes: true,
      subscription: {
        with: { studentProfile: { with: { user: true } } },
      },
    },
  });

  return rows
    .map((row) => ({
      id: row.id,
      scheduledAt: row.scheduledAt,
      sessionNumber: row.sessionNumber,
      status: row.status,
      groupName: row.group?.name ?? null,
      studentName: row.subscription.studentProfile.user.name,
      participantCount: row.participants.length,
      reason: pendingReason(
        row.status,
        row.participants.length,
        Boolean(row.notes && (row.notes.content || row.notes.homework))
      ),
    }))
    // Le prédicat de type rend la raison NON nulle pour l'appelant :
    // l'écran affiche son étiquette sans avoir à re-tester.
    .filter((row): row is typeof row & { reason: PendingReason } =>
      row.reason !== null
    );
}

/**
 * Assiduité groupe par groupe.
 *
 * Les séances SANS groupe sont écartées : « hors groupe » n'est pas un
 * groupe, et les additionner donnerait une ligne fourre-tout qu'on ne
 * saurait pas relancer. Elles restent comptées dans le taux global.
 * Ce commentaire fait foi.
 */
export async function getAttendanceByGroup(filters: Filters = {}) {
  const institute = await requireInstitute();
  const rows = await db
    .select({
      groupId: groups.id,
      groupName: groups.name,
      ...countedColumns,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .innerJoin(groups, eq(groups.id, sessions.groupId))
    .where(attendanceConditions(institute, filters))
    .groupBy(groups.id, groups.name);

  return rows
    .map((row) => ({
      groupId: row.groupId,
      groupName: row.groupName,
      ...buildStats(row),
    }))
    .filter((row) => row.rated > 0 || row.excused > 0)
    .sort((a, b) => a.rate - b.rate || b.missed - a.missed);
}

/**
 * Assiduité par enseignante.
 *
 * Ce taux dit quelque chose des ÉLÈVES d'une enseignante, pas de son
 * travail : une classe du samedi matin ne se compare pas à un cours
 * particulier du soir. Il sert à repérer un créneau qui se vide, pas à
 * noter quelqu'un. Ce commentaire fait foi.
 */
export async function getAttendanceByTeacher(filters: Filters = {}) {
  const institute = await requireInstitute();
  const rows = await db
    .select({
      staffMemberId: staffMembers.id,
      staffName: staffMembers.name,
      ...countedColumns,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .innerJoin(staffMembers, eq(staffMembers.id, sessions.staffMemberId))
    .where(attendanceConditions(institute, filters))
    .groupBy(staffMembers.id, staffMembers.name);

  return rows
    .map((row) => ({
      staffMemberId: row.staffMemberId,
      staffName: row.staffName,
      ...buildStats(row),
    }))
    .filter((row) => row.rated > 0 || row.excused > 0)
    .sort((a, b) => a.rate - b.rate || b.missed - a.missed);
}

/**
 * Assiduité mois par mois, du plus ancien au plus récent.
 *
 * ── Le découpage se fait en JavaScript, pas en SQL ──
 *
 * Le mois d'une séance dépend du FUSEAU de l'institut : une séance du
 * 1ᵉʳ mai à 00 h 30 à Paris appartient à mai, pas à avril comme le
 * dirait un découpage en UTC. Écrire ce découpage en SQL le dupliquerait
 * — `monthKey` le fait déjà, et c'est lui qui sert partout ailleurs dans
 * l'application. Une table de pointages tient en mémoire ; le jour où ce
 * ne sera plus vrai, ce sera le moment d'écrire l'agrégat en SQL, avec
 * le même fuseau. Ce commentaire fait foi.
 */
export async function getAttendanceByMonth(
  timeZone: string,
  filters: Filters = {}
) {
  const institute = await requireInstitute();
  const rows = await db
    .select({
      scheduledAt: sessions.scheduledAt,
      status: sessionParticipants.attendanceStatus,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(attendanceConditions(institute, filters));

  const buckets = new Map<string, { attended: number; missed: number; excused: number }>();

  for (const row of rows) {
    const key = monthKey(row.scheduledAt, timeZone);
    const bucket = buckets.get(key) ?? { attended: 0, missed: 0, excused: 0 };
    if ((ATTENDED_STATUSES as readonly string[]).includes(row.status)) bucket.attended += 1;
    else if ((MISSED_STATUSES as readonly string[]).includes(row.status)) bucket.missed += 1;
    else if (row.status === "excused") bucket.excused += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([month, counts]) => ({ month, ...buildStats(counts) }))
    .filter((row) => row.rated > 0 || row.excused > 0)
    .sort((a, b) => a.month.localeCompare(b.month));
}

export type PendingReason = "status_pending" | "no_participants" | "no_report";

export const PENDING_REASON_LABELS: Record<PendingReason, string> = {
  status_pending: "Issue non tranchée",
  no_participants: "Appel non fait",
  no_report: "Sans compte rendu",
};

/**
 * Ce qui reste à faire sur une séance passée, ou `null` si tout est fait.
 *
 * Seul point d'entrée de la notion « à traiter ». Une séance annulée
 * n'attend rien de personne : elle n'arrive jamais ici.
 */
export function pendingReason(
  status: string,
  participantCount: number,
  hasReport: boolean
): PendingReason | null {
  if (status === "cancelled") return null;
  if (status === "planned") return "status_pending";
  if (participantCount === 0) return "no_participants";
  if (status === "completed" && !hasReport) return "no_report";
  return null;
}
