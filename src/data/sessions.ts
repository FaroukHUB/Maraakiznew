import { eq, and, gt, sql, inArray, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  sessionParticipants,
  sessionResources,
  sessionNotes,
  subscriptions,
  CONSUMING_STATUSES,
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

export async function getConsumedSessionCount(
  subscriptionId: string
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        eq(sessions.subscriptionId, subscriptionId),
        inArray(sessions.status, [...CONSUMING_STATUSES])
      )
    );
  return Number(result[0].count);
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
