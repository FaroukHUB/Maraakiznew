import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function getActivePackForStudent(
  studentProfileId: string
): Promise<typeof subscriptions.$inferSelect | null> {
  const institute = await requireInstitute();
  const result = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.studentProfileId, studentProfileId),
      eq(subscriptions.status, "active"),
      eq(subscriptions.instituteId, institute)
    ),
  });
  return result ?? null;
}

export async function getPacksByStudentId(
  studentProfileId: string
): Promise<(typeof subscriptions.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.studentProfileId, studentProfileId),
      eq(subscriptions.instituteId, institute)
    ),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

export async function getPackById(
  packId: string
): Promise<typeof subscriptions.$inferSelect | null> {
  const institute = await requireInstitute();
  const result = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, packId),
      eq(subscriptions.instituteId, institute)
    ),
  });
  return result ?? null;
}
