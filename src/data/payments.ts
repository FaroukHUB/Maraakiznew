import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";

export async function getPaymentsByStudentId(
  studentProfileId: string
): Promise<(typeof payments.$inferSelect)[]> {
  return db.query.payments.findMany({
    where: eq(payments.studentProfileId, studentProfileId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export async function getPaymentsByPackId(
  subscriptionId: string
): Promise<(typeof payments.$inferSelect)[]> {
  return db.query.payments.findMany({
    where: eq(payments.subscriptionId, subscriptionId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export async function getPendingPaymentCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(eq(payments.status, "pending"));
  return Number(result[0].count);
}

export async function getAllPaymentsForAdmin() {
  return db.query.payments.findMany({
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
    },
  });
}

export async function getPaymentById(paymentId: string) {
  return db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
    },
  });
}

export async function getLatestPaymentForStudent(
  studentProfileId: string
): Promise<typeof payments.$inferSelect | null> {
  const result = await db.query.payments.findFirst({
    where: eq(payments.studentProfileId, studentProfileId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  return result ?? null;
}
