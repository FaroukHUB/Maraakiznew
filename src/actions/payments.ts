"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import { payments, CAPABILITIES } from "@/db/schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function createPayment(data: {
  subscriptionId: string;
  studentProfileId: string;
  amountCents: number;
  method: "paypal" | "bank_transfer" | "cash" | "other";
  status: "pending" | "received";
  externalReference?: string;
  paidAt?: Date;
  notes?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.financeManage);
    await db.insert(payments).values({
      instituteId: institute,
      subscriptionId: data.subscriptionId,
      studentProfileId: data.studentProfileId,
      amountCents: data.amountCents,
      method: data.method,
      status: data.status,
      externalReference: data.externalReference || null,
      paidAt: data.status === "received" ? (data.paidAt ?? new Date()) : null,
      notes: data.notes || null,
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/dashboard");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création du paiement." };
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  newStatus: "pending" | "received" | "failed" | "refunded"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.financeManage);
    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.instituteId, institute), eq(payments.id, paymentId)),
    });
    if (!payment) return { success: false, error: "Paiement introuvable." };

    await db
      .update(payments)
      .set({
        status: newStatus,
        paidAt: newStatus === "received" ? (payment.paidAt ?? new Date()) : payment.paidAt,
      })
      .where(and(eq(payments.instituteId, institute), eq(payments.id, paymentId)));

    revalidatePath("/admin/payments");
    revalidatePath("/admin/dashboard");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

export async function updatePayment(
  paymentId: string,
  data: {
    externalReference?: string;
    notes?: string;
    method?: "paypal" | "bank_transfer" | "cash" | "other";
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.financeManage);
    await db
      .update(payments)
      .set({
        ...(data.externalReference !== undefined && { externalReference: data.externalReference || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.method && { method: data.method }),
      })
      .where(and(eq(payments.instituteId, institute), eq(payments.id, paymentId)));

    revalidatePath("/admin/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}
