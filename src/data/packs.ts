import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

export async function getActivePackForStudent(
  studentProfileId: string
): Promise<typeof subscriptions.$inferSelect | null> {
  const result = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.studentProfileId, studentProfileId),
      eq(subscriptions.status, "active")
    ),
  });
  return result ?? null;
}

export async function getPacksByStudentId(
  studentProfileId: string
): Promise<(typeof subscriptions.$inferSelect)[]> {
  return db.query.subscriptions.findMany({
    where: eq(subscriptions.studentProfileId, studentProfileId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

export async function getPackById(
  packId: string
): Promise<typeof subscriptions.$inferSelect | null> {
  const result = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, packId),
  });
  return result ?? null;
}
