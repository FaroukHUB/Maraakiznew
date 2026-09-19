import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { referralCodes, referrals } from "@/db/schema";

export { REFERRAL_STATUS_LABELS } from "@/lib/constants";

export async function getReferralsForAdmin() {
  return db.query.referrals.findMany({
    orderBy: [desc(referrals.createdAt)],
    with: {
      referrer: { with: { user: true } },
      referred: { with: { user: true } },
      prospect: true,
    },
  });
}

export async function getReferralCodeForStudent(studentProfileId: string) {
  return db.query.referralCodes.findFirst({
    where: eq(referralCodes.studentProfileId, studentProfileId),
  });
}

export async function getReferralsByStudent(studentProfileId: string) {
  return db.query.referrals.findMany({
    where: eq(referrals.referrerProfileId, studentProfileId),
    orderBy: [desc(referrals.createdAt)],
    with: { referred: { with: { user: true } }, prospect: true },
  });
}

/** Récompenses acquises et non encore remises. */
export async function getPendingRewards() {
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${referrals.rewardCents}), 0)`,
    })
    .from(referrals)
    .where(eq(referrals.status, "earned"));

  return { count: Number(row?.count ?? 0), totalCents: Number(row?.total ?? 0) };
}
