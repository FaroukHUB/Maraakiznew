import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  reportCards,
  sessions,
  sessionParticipants,
  skills,
  skillProgress,
  memorizationItems,
  memorizationReviews,
  subscriptions,
  type ProgramProgressSnapshot,
} from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";
import { getStudentProgress } from "@/data/skills";
import { getMemorizedAyahCount } from "@/data/memorization";

// ─── Types ───────────────────────────────────────────────

export type ReportCardSnapshot = {
  sessionsCount: number;
  attendanceAttended: number;
  attendanceMissed: number;
  attendanceExcused: number;
  attendanceRate: number;
  skillsAcquired: number;
  skillsTotal: number;
  skillsAcquiredInPeriod: number;
  programProgress: ProgramProgressSnapshot[];
  memorizedAyahs: number;
  memorizedPortionsInPeriod: number;
  reviewsInPeriod: number;
};

// ─── Constat ─────────────────────────────────────────────

/**
 * Calcule le constat d'une élève sur une période.
 *
 * Deux natures de chiffres cohabitent, volontairement :
 *   - ce qui s'est passé PENDANT la période (séances, acquis validés,
 *     portions mémorisées, révisions) — le travail du trimestre ;
 *   - l'état CUMULÉ à la fin de la période (progression, volume
 *     mémorisé) — où en est l'élève.
 *
 * Un bulletin a besoin des deux : « ce qu'elle a fait » et « où elle en
 * est ». Les libellés de l'interface doivent le refléter.
 */
export async function computeSnapshot(
  studentProfileId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ReportCardSnapshot> {
  const institute = await requireInstitute();
  // La borne de fin est inclusive : on prend la journée entière.
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  // Assiduité de CETTE élève sur la période. Mêmes statuts que
  // ATTENDED_STATUSES / MISSED_STATUSES : present et late comptent comme
  // présence, absent comme absence, excused reste hors du taux.
  const [attendanceRow] = await db
    .select({
      attended: sql<number>`count(*) filter (where ${sessionParticipants.attendanceStatus} in ('present','late'))`,
      missed: sql<number>`count(*) filter (where ${sessionParticipants.attendanceStatus} = 'absent')`,
      excused: sql<number>`count(*) filter (where ${sessionParticipants.attendanceStatus} = 'excused')`,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(
      and(
        eq(sessionParticipants.studentProfileId, studentProfileId),
        gte(sessions.scheduledAt, periodStart),
        lte(sessions.scheduledAt, end),
        sql`${sessions.status} <> 'cancelled'`,
        eq(sessions.instituteId, institute)
      )
    );

  const attended = Number(attendanceRow?.attended ?? 0);
  const missed = Number(attendanceRow?.missed ?? 0);
  const excused = Number(attendanceRow?.excused ?? 0);
  const rated = attended + missed;

  // Séances de la période, que l'élève en soit porteuse ou participante.
  const [sessionsRow] = await db
    .select({ count: sql<number>`count(distinct ${sessions.id})` })
    .from(sessions)
    .leftJoin(subscriptions, eq(subscriptions.id, sessions.subscriptionId))
    .leftJoin(sessionParticipants, eq(sessionParticipants.sessionId, sessions.id))
    .where(
      and(
        gte(sessions.scheduledAt, periodStart),
        lte(sessions.scheduledAt, end),
        sql`${sessions.status} <> 'cancelled'`,
        sql`(${subscriptions.studentProfileId} = ${studentProfileId} or ${sessionParticipants.studentProfileId} = ${studentProfileId})`,
        eq(sessions.instituteId, institute)
      )
    );

  // Progression cumulée, par programme
  const progress = await getStudentProgress(studentProfileId);
  const programProgress: ProgramProgressSnapshot[] = progress.map((p) => ({
    programId: p.programId,
    programName: p.programName,
    acquired: p.acquired,
    total: p.total,
    rate: p.rate,
  }));

  // Acquis validés PENDANT la période
  const [acquiredRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skillProgress)
    .innerJoin(skills, eq(skills.id, skillProgress.skillId))
    .where(
      and(
        eq(skillProgress.studentProfileId, studentProfileId),
        eq(skillProgress.status, "acquired"),
        sql`${skillProgress.validatedAt} is not null`,
        gte(skillProgress.validatedAt, periodStart),
        lte(skillProgress.validatedAt, end),
        eq(skillProgress.instituteId, institute)
      )
    );

  // Mémorisation
  const memorizedAyahs = await getMemorizedAyahCount(studentProfileId);

  const [portionsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(memorizationItems)
    .where(
      and(
        eq(memorizationItems.studentProfileId, studentProfileId),
        gte(memorizationItems.memorizedAt, periodStart),
        lte(memorizationItems.memorizedAt, end),
        eq(memorizationItems.instituteId, institute)
      )
    );

  const [reviewsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(memorizationReviews)
    .innerJoin(
      memorizationItems,
      eq(memorizationItems.id, memorizationReviews.itemId)
    )
    .where(
      and(
        eq(memorizationItems.studentProfileId, studentProfileId),
        gte(memorizationReviews.reviewedAt, periodStart),
        lte(memorizationReviews.reviewedAt, end),
        eq(memorizationReviews.instituteId, institute)
      )
    );

  return {
    sessionsCount: Number(sessionsRow?.count ?? 0),
    attendanceAttended: attended,
    attendanceMissed: missed,
    attendanceExcused: excused,
    attendanceRate: rated > 0 ? Math.round((attended / rated) * 100) : 0,
    skillsAcquired: programProgress.reduce((sum, p) => sum + p.acquired, 0),
    skillsTotal: programProgress.reduce((sum, p) => sum + p.total, 0),
    skillsAcquiredInPeriod: Number(acquiredRow?.count ?? 0),
    programProgress,
    memorizedAyahs,
    memorizedPortionsInPeriod: Number(portionsRow?.count ?? 0),
    reviewsInPeriod: Number(reviewsRow?.count ?? 0),
  };
}

// ─── Queries ─────────────────────────────────────────────

export async function getReportCardsForAdmin() {
  const institute = await requireInstitute();
  return db.query.reportCards.findMany({
    where: eq(reportCards.instituteId, institute),
    orderBy: [desc(reportCards.periodEnd), desc(reportCards.createdAt)],
    with: { studentProfile: { with: { user: true } } },
  });
}

export async function getReportCardById(id: string) {
  const institute = await requireInstitute();
  return db.query.reportCards.findFirst({
    where: and(
      eq(reportCards.id, id),
      eq(reportCards.instituteId, institute)
    ),
    with: { studentProfile: { with: { user: true } } },
  });
}

/** Bulletins publiés d'une élève — c'est tout ce qu'elle doit voir. */
export async function getPublishedReportCards(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.reportCards.findMany({
    where: and(
      eq(reportCards.studentProfileId, studentProfileId),
      eq(reportCards.status, "published"),
      eq(reportCards.instituteId, institute)
    ),
    orderBy: [desc(reportCards.periodEnd)],
  });
}
