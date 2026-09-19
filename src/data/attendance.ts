import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  sessionParticipants,
  studentProfiles,
  users,
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
  month?: string; // "2026-04"
};

// ─── Helpers ─────────────────────────────────────────────

/**
 * Conditions communes à toute query d'assiduité.
 *
 * Seules les séances déjà passées et non annulées comptent : une
 * séance à venir ne doit pas faire chuter le taux, et une séance
 * annulée n'est la faute de personne.
 */
function attendanceConditions(filters: Filters = {}) {
  const conditions = [
    lt(sessions.scheduledAt, new Date()),
    sql`${sessions.status} <> 'cancelled'`,
  ];

  if (filters.groupId) {
    conditions.push(eq(sessions.groupId, filters.groupId));
  }
  if (filters.month) {
    conditions.push(sql`to_char(${sessions.scheduledAt}, 'YYYY-MM') = ${filters.month}`);
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
  const [row] = await db
    .select(countedColumns)
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(attendanceConditions(filters));

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
    .where(attendanceConditions(filters))
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
  const [row] = await db
    .select(countedColumns)
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(
      and(
        attendanceConditions(filters),
        eq(sessionParticipants.studentProfileId, studentProfileId)
      )
    );

  return buildStats(row ?? { attended: 0, missed: 0, excused: 0 });
}

/**
 * Séances passées dont la présence reste à traiter.
 *
 * Deux cas, tous deux bloquants pour un taux d'assiduité fiable :
 *   1. la séance est passée mais toujours "planned" — son issue
 *      n'a pas été tranchée ;
 *   2. la séance est terminée mais aucune participante n'est
 *      enregistrée — l'appel n'a jamais été fait.
 */
export async function getSessionsNeedingAttendance() {
  const rows = await db.query.sessions.findMany({
    where: and(
      lt(sessions.scheduledAt, new Date()),
      sql`${sessions.status} <> 'cancelled'`
    ),
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    with: {
      group: true,
      participants: true,
      subscription: {
        with: { studentProfile: { with: { user: true } } },
      },
    },
  });

  return rows
    .filter((row) => row.status === "planned" || row.participants.length === 0)
    .map((row) => ({
      id: row.id,
      scheduledAt: row.scheduledAt,
      sessionNumber: row.sessionNumber,
      status: row.status,
      groupName: row.group?.name ?? null,
      studentName: row.subscription.studentProfile.user.name,
      participantCount: row.participants.length,
      reason:
        row.status === "planned"
          ? ("status_pending" as const)
          : ("no_participants" as const),
    }));
}
