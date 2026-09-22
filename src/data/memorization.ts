import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { memorizationItems, studentProfiles, users } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

// ─── Types ───────────────────────────────────────────────

export type DueItem = {
  id: string;
  studentProfileId: string;
  studentName: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
  intervalIndex: number;
  daysOverdue: number;
};

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

// ─── Queries ─────────────────────────────────────────────

/** Portions mémorisées par une élève, la plus urgente d'abord. */
export async function getMemorizationForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  const items = await db.query.memorizationItems.findMany({
    where: and(
      eq(memorizationItems.studentProfileId, studentProfileId),
      eq(memorizationItems.active, true),
      eq(memorizationItems.instituteId, institute)
    ),
    orderBy: [asc(memorizationItems.nextReviewAt)],
    with: {
      reviews: {
        orderBy: (r, { desc }) => [desc(r.reviewedAt)],
        limit: 5,
      },
    },
  });

  const now = new Date();
  return items.map((item) => ({
    ...item,
    daysOverdue: daysBetween(item.nextReviewAt, now),
  }));
}

/**
 * Révisions dues, toutes élèves confondues, la plus en retard d'abord.
 *
 * "Due" veut dire nextReviewAt <= maintenant. Le retard est exprimé en
 * jours pleins : une portion prévue ce matin n'est pas « en retard », elle
 * est simplement à faire.
 */
export async function getDueReviews(limit?: number): Promise<DueItem[]> {
  const institute = await requireInstitute();
  const now = new Date();

  const rows = await db
    .select({
      id: memorizationItems.id,
      studentProfileId: memorizationItems.studentProfileId,
      studentName: users.name,
      surahNumber: memorizationItems.surahNumber,
      ayahStart: memorizationItems.ayahStart,
      ayahEnd: memorizationItems.ayahEnd,
      nextReviewAt: memorizationItems.nextReviewAt,
      lastReviewedAt: memorizationItems.lastReviewedAt,
      intervalIndex: memorizationItems.intervalIndex,
    })
    .from(memorizationItems)
    .innerJoin(
      studentProfiles,
      eq(studentProfiles.id, memorizationItems.studentProfileId)
    )
    .innerJoin(users, eq(users.id, studentProfiles.userId))
    .where(
      and(
        eq(memorizationItems.active, true),
        lte(memorizationItems.nextReviewAt, now),
        eq(memorizationItems.instituteId, institute)
      )
    )
    .orderBy(asc(memorizationItems.nextReviewAt))
    .limit(limit ?? 500);

  return rows.map((row) => ({
    ...row,
    daysOverdue: daysBetween(row.nextReviewAt, now),
  }));
}

/** Nombre de révisions dues — pour l'indicateur du tableau de bord. */
export async function getDueReviewCount(): Promise<number> {
  const institute = await requireInstitute();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(memorizationItems)
    .where(
      and(
        eq(memorizationItems.active, true),
        lte(memorizationItems.nextReviewAt, new Date()),
        eq(memorizationItems.instituteId, institute)
      )
    );
  return Number(row?.count ?? 0);
}

/**
 * Volume mémorisé par une élève, en versets.
 *
 * Somme des portions actives. Les plages qui se chevauchent seraient
 * comptées deux fois : c'est assumé, une portion est saisie une fois.
 */
export async function getMemorizedAyahCount(
  studentProfileId: string
): Promise<number> {
  const institute = await requireInstitute();
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${memorizationItems.ayahEnd} - ${memorizationItems.ayahStart} + 1), 0)`,
    })
    .from(memorizationItems)
    .where(
      and(
        eq(memorizationItems.studentProfileId, studentProfileId),
        eq(memorizationItems.active, true),
        eq(memorizationItems.instituteId, institute)
      )
    );
  return Number(row?.total ?? 0);
}
