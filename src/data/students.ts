import { eq, sql, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  studentProfiles,
  subscriptions,
  sessions,
  sessionParticipants,
  payments,
  CONSUMING_STATUSES,
} from "@/db/schema";

// ─── Types dérivés pour les vues enrichies ───────────────

export type StudentWithProfile = typeof users.$inferSelect & {
  profile: typeof studentProfiles.$inferSelect;
};

export type StudentWithDetails = StudentWithProfile & {
  activePack: typeof subscriptions.$inferSelect | null;
  completedSessions: number;
  paymentStatus: "pending" | "received" | "failed" | "refunded";
  programSlug: string | null;
};

// ─── Queries ─────────────────────────────────────────────

export async function getStudentByUserId(
  userId: string
): Promise<StudentWithProfile | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { studentProfile: true },
  });
  if (!result || !result.studentProfile) return null;
  return { ...result, profile: result.studentProfile };
}

export async function getStudentByProfileId(
  profileId: string
): Promise<StudentWithProfile | null> {
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.id, profileId),
    with: { user: true },
  });
  if (!profile) return null;
  return { ...profile.user, profile };
}

export async function getAllStudentsWithDetails(): Promise<StudentWithDetails[]> {
  const allProfiles = await db.query.studentProfiles.findMany({
    with: {
      user: true,
      subscriptions: {
        with: {
          sessions: true,
          program: true,
        },
      },
      payments: true,
    },
  });

  return allProfiles.map((profile) => {
    const activeSub = profile.subscriptions.find((s) => s.status === "active") ?? null;

    const completedSessions = activeSub
      ? activeSub.sessions.filter((s) =>
          (CONSUMING_STATUSES as readonly string[]).includes(s.status)
        ).length
      : 0;

    const latestPayment = profile.payments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const programSlug = activeSub
      ? profile.subscriptions.find((s) => s.id === activeSub.id)
          ? (activeSub as unknown as { program: { slug: string } }).program?.slug ?? null
          : null
      : null;

    return {
      ...profile.user,
      profile,
      activePack: activeSub,
      completedSessions,
      paymentStatus: latestPayment?.status ?? "pending",
      programSlug,
    };
  });
}

// ─── Admin: full student profile ─────────────────────────

export async function getStudentFullProfile(profileId: string) {
  // Main profile with subscriptions, sessions, payments (4 levels max)
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.id, profileId),
    with: {
      user: true,
      subscriptions: {
        orderBy: (s, { desc }) => [desc(s.createdAt)],
        with: {
          program: true,
          sessions: {
            orderBy: (s, { asc }) => [asc(s.sessionNumber)],
            with: { notes: true },
          },
          payments: {
            orderBy: (p, { desc }) => [desc(p.createdAt)],
          },
        },
      },
      payments: {
        orderBy: (p, { desc }) => [desc(p.createdAt)],
      },
    },
  });
  if (!profile) return null;

  // Group participations loaded separately to avoid 6-level nesting
  // (PostgreSQL truncates aliases beyond 63 chars)
  const participations = await db.query.sessionParticipants.findMany({
    where: eq(sessionParticipants.studentProfileId, profileId),
    with: {
      session: {
        with: {
          subscription: {
            with: { studentProfile: { with: { user: true } } },
          },
        },
      },
    },
  });

  return { ...profile, sessionParticipations: participations };
}

export async function getStudentCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentProfiles);
  return Number(result[0].count);
}
