import { eq, and, gt, sql, inArray, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  sessionParticipants,
  sessionResources,
  sessionNotes,
  subscriptions,
  CONSUMING_STATUSES,
  CONSUMING_ATTENDANCE_STATUSES,
} from "@/db/schema";

export async function getSessionsByPackId(
  subscriptionId: string
): Promise<(typeof sessions.$inferSelect)[]> {
  return db.query.sessions.findMany({
    where: eq(sessions.subscriptionId, subscriptionId),
    orderBy: (s, { asc }) => [asc(s.sessionNumber)],
  });
}

export async function getSessionById(sessionId: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      notes: true,
      participants: {
        with: { studentProfile: { with: { user: true } } },
      },
      resources: true,
    },
  });
}

export async function getUpcomingSessions(limit: number = 5) {
  const now = new Date();
  return db.query.sessions.findMany({
    where: and(
      eq(sessions.status, "planned"),
      gt(sessions.scheduledAt, now)
    ),
    orderBy: (s, { asc }) => [asc(s.scheduledAt)],
    limit,
  });
}

/**
 * Séances consommées par un forfait.
 *
 * Deux sources, additionnées :
 *
 *   1. Les séances PORTÉES par ce forfait (sessions.subscriptionId), selon
 *      CONSUMING_STATUSES. C'est la règle historique, inchangée.
 *
 *   2. Les PARTICIPATIONS à une séance portée par un AUTRE forfait — le cas
 *      des cours collectifs — selon CONSUMING_ATTENDANCE_STATUSES.
 *
 * La condition `sessions.subscriptionId <> subscriptionId` du second terme
 * empêche le double comptage du forfait porteur.
 *
 * Les participations dont subscriptionId est NULL ne comptent pas : ce sont
 * celles enregistrées avant cette règle, le comportement passé est préservé.
 *
 * Unique implémentation du calcul : tout le reste de l'app passe par ici.
 */
export async function getConsumedSessionCount(
  subscriptionId: string
): Promise<number> {
  const [counts] = await getConsumedSessionCounts([subscriptionId]);
  return counts?.consumed ?? 0;
}

/**
 * Version groupée, pour les listes (fiche élève, liste des élèves).
 *
 * Évite le N+1 : une requête pour les séances portées, une pour les
 * participations, quel que soit le nombre de forfaits.
 */
export async function getConsumedSessionCounts(
  subscriptionIds: string[]
): Promise<{ subscriptionId: string; consumed: number }[]> {
  if (subscriptionIds.length === 0) return [];

  const owned = await db
    .select({
      subscriptionId: sessions.subscriptionId,
      count: sql<number>`count(*)`,
    })
    .from(sessions)
    .where(
      and(
        inArray(sessions.subscriptionId, subscriptionIds),
        inArray(sessions.status, [...CONSUMING_STATUSES])
      )
    )
    .groupBy(sessions.subscriptionId);

  const attended = await db
    .select({
      subscriptionId: sessionParticipants.subscriptionId,
      count: sql<number>`count(*)`,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(
      and(
        inArray(sessionParticipants.subscriptionId, subscriptionIds),
        sql`${sessions.subscriptionId} <> ${sessionParticipants.subscriptionId}`,
        inArray(sessions.status, [...CONSUMING_STATUSES]),
        inArray(sessionParticipants.attendanceStatus, [
          ...CONSUMING_ATTENDANCE_STATUSES,
        ])
      )
    )
    .groupBy(sessionParticipants.subscriptionId);

  const totals = new Map(subscriptionIds.map((id) => [id, 0]));
  for (const row of owned) {
    if (row.subscriptionId) {
      totals.set(row.subscriptionId, (totals.get(row.subscriptionId) ?? 0) + Number(row.count));
    }
  }
  for (const row of attended) {
    if (row.subscriptionId) {
      totals.set(row.subscriptionId, (totals.get(row.subscriptionId) ?? 0) + Number(row.count));
    }
  }

  return [...totals].map(([subscriptionId, consumed]) => ({ subscriptionId, consumed }));
}

/**
 * Forfaits impactés par une séance : le forfait porteur, plus ceux des
 * participantes. Sert à refermer tous les forfaits arrivés à leur terme
 * après un changement de statut, pas seulement celui du porteur.
 */
export async function getSubscriptionIdsAffectedBySession(
  sessionId: string
): Promise<string[]> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { participants: true },
  });
  if (!session) return [];

  const ids = new Set<string>([session.subscriptionId]);
  for (const participant of session.participants) {
    if (participant.subscriptionId) ids.add(participant.subscriptionId);
  }
  return [...ids];
}

export async function getWeekSessionCount(): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        gt(sessions.scheduledAt, startOfWeek),
        sql`${sessions.scheduledAt} < ${endOfWeek}`
      )
    );
  return Number(result[0].count);
}

export async function getLastCompletedSession(subscriptionId: string) {
  const result = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.subscriptionId, subscriptionId),
      eq(sessions.status, "completed")
    ),
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    with: { notes: true },
  });
  return result ?? null;
}

// ─── Admin queries ───────────────────────────────────────

export async function getAllSessionsForAdmin() {
  return db.query.sessions.findMany({
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    with: {
      subscription: {
        with: {
          studentProfile: { with: { user: true } },
          program: true,
        },
      },
      notes: true,
    },
  });
}

export async function getSessionWithFullDetails(sessionId: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      subscription: {
        with: {
          studentProfile: { with: { user: true } },
          program: true,
          sessions: true, // all sessions in this pack, for context
        },
      },
      notes: true,
      group: true,
      participants: {
        with: { studentProfile: { with: { user: true } } },
      },
      resources: true,
    },
  });
}

// ─── Student query (access-checked at page level) ───────

export async function getStudentSessionDetail(sessionId: string, studentProfileId: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      subscription: {
        with: { program: true },
      },
      notes: true,
      participants: {
        with: { studentProfile: { with: { user: true } } },
      },
      resources: true,
    },
  });
  if (!session) return null;

  // Access check: the subscription must belong to this student
  if (session.subscription.studentProfileId !== studentProfileId) {
    // For group sessions, check if the student is a participant
    const isParticipant = session.participants.some(
      (p) => p.studentProfileId === studentProfileId
    );
    if (!isParticipant) return null;
  }

  // Filter resources by visibility for this student
  const participant = session.participants.find(
    (p) => p.studentProfileId === studentProfileId
  );
  const visibleResources = session.resources.filter((r) => {
    if (r.visibleTo === "all") return true;
    // participants_only: must be a participant with replay access for videos
    if (!participant) return false;
    if (r.type === "replay_video") return participant.hasReplayAccess;
    return true;
  });

  return { ...session, resources: visibleResources };
}

export async function getNextSessionNumber(subscriptionId: string): Promise<number> {
  const result = await db
    .select({ max: sql<number>`coalesce(max(${sessions.sessionNumber}), 0)` })
    .from(sessions)
    .where(eq(sessions.subscriptionId, subscriptionId));
  return Number(result[0].max) + 1;
}
