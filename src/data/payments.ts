import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function getPaymentsByStudentId(
  studentProfileId: string
): Promise<(typeof payments.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.payments.findMany({
    where: and(
      eq(payments.studentProfileId, studentProfileId),
      eq(payments.instituteId, institute)
    ),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export async function getPaymentsByPackId(
  subscriptionId: string
): Promise<(typeof payments.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.payments.findMany({
    where: and(
      eq(payments.subscriptionId, subscriptionId),
      eq(payments.instituteId, institute)
    ),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export async function getPendingPaymentCount(): Promise<number> {
  const institute = await requireInstitute();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(
      and(
        eq(payments.status, "pending"),
        eq(payments.instituteId, institute)
      )
    );
  return Number(result[0].count);
}

export async function getAllPaymentsForAdmin() {
  const institute = await requireInstitute();
  return db.query.payments.findMany({
    where: eq(payments.instituteId, institute),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
    },
  });
}

export async function getPaymentById(paymentId: string) {
  const institute = await requireInstitute();
  return db.query.payments.findFirst({
    where: and(
      eq(payments.id, paymentId),
      eq(payments.instituteId, institute)
    ),
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
    },
  });
}

export async function getLatestPaymentForStudent(
  studentProfileId: string
): Promise<typeof payments.$inferSelect | null> {
  const institute = await requireInstitute();
  const result = await db.query.payments.findFirst({
    where: and(
      eq(payments.studentProfileId, studentProfileId),
      eq(payments.instituteId, institute)
    ),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  return result ?? null;
}
