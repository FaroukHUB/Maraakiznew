import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { referralCodes, referrals } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export { REFERRAL_STATUS_LABELS } from "@/lib/constants";

export async function getReferralsForAdmin() {
  const institute = await requireInstitute();
  return db.query.referrals.findMany({
    where: eq(referrals.instituteId, institute),
    orderBy: [desc(referrals.createdAt)],
    with: {
      referrer: { with: { user: true } },
      referred: { with: { user: true } },
      prospect: true,
    },
  });
}

export async function getReferralCodeForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.referralCodes.findFirst({
    where: and(
      eq(referralCodes.studentProfileId, studentProfileId),
      eq(referralCodes.instituteId, institute)
    ),
  });
}

export async function getReferralsByStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.referrals.findMany({
    where: and(
      eq(referrals.referrerProfileId, studentProfileId),
      eq(referrals.instituteId, institute)
    ),
    orderBy: [desc(referrals.createdAt)],
    with: { referred: { with: { user: true } }, prospect: true },
  });
}

/** Récompenses acquises et non encore remises. */
export async function getPendingRewards() {
  const institute = await requireInstitute();
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${referrals.rewardCents}), 0)`,
    })
    .from(referrals)
    .where(
      and(
        eq(referrals.status, "earned"),
        eq(referrals.instituteId, institute)
      )
    );

  return { count: Number(row?.count ?? 0), totalCents: Number(row?.total ?? 0) };
}
