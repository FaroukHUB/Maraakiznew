"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import { subscriptions, studentProfiles, CAPABILITIES } from "@/db/schema";

type ActionResult = { success: true; id?: string } | { success: false; error: string };

// ─── Create ──────────────────────────────────────────────

export async function createSubscription(data: {
  studentProfileId: string;
  programId: string;
  sessionType: "individual" | "group";
  totalSessions: number;
  weeklyRhythm: number;
  priceCents: number;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.financeManage);
    const profile = await db.query.studentProfiles.findFirst({
      where: and(eq(studentProfiles.instituteId, institute), eq(studentProfiles.id, data.studentProfileId)),
    });
    if (!profile) return { success: false, error: "Élève introuvable." };

    // Check: no active subscription for the same program
    const existing = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.instituteId, institute),
        eq(subscriptions.studentProfileId, data.studentProfileId),
        eq(subscriptions.programId, data.programId),
        eq(subscriptions.status, "active")
      ),
    });
    if (existing) {
      return {
        success: false,
        error: "Cette élève a déjà un forfait actif pour ce programme. Fermez-le d'abord.",
      };
    }

    const [sub] = await db
      .insert(subscriptions)
      .values({
        instituteId: institute,
        studentProfileId: data.studentProfileId,
        programId: data.programId,
        sessionType: data.sessionType,
        totalSessions: data.totalSessions,
        weeklyRhythm: data.weeklyRhythm,
        priceCents: data.priceCents,
        status: "active",
        startedAt: new Date(),
      })
      .returning();

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${data.studentProfileId}`);
    revalidatePath("/admin/dashboard");
    return { success: true, id: sub.id };
  } catch {
    return { success: false, error: "Erreur lors de la création du forfait." };
  }
}

// ─── Close manually ──────────────────────────────────────

export async function closeSubscription(
  subscriptionId: string,
  reason: "student_request" | "teacher_decision" | "non_payment" | "expired"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.financeManage);
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.instituteId, institute), eq(subscriptions.id, subscriptionId)),
    });
    if (!sub) return { success: false, error: "Forfait introuvable." };
    if (sub.status !== "active") {
      return { success: false, error: "Ce forfait n'est pas actif." };
    }

    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        closedAt: new Date(),
        closureReason: reason,
      })
      .where(and(eq(subscriptions.instituteId, institute), eq(subscriptions.id, subscriptionId)));

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${sub.studentProfileId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la fermeture." };
  }
}

// ─── Update ──────────────────────────────────────────────

export async function updateSubscription(
  subscriptionId: string,
  data: {
    totalSessions?: number;
    weeklyRhythm?: number;
    priceCents?: number;
    sessionType?: "individual" | "group";
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.financeManage);
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.instituteId, institute), eq(subscriptions.id, subscriptionId)),
    });
    if (!sub) return { success: false, error: "Forfait introuvable." };

    await db
      .update(subscriptions)
      .set({
        ...(data.totalSessions !== undefined && { totalSessions: data.totalSessions }),
        ...(data.weeklyRhythm !== undefined && { weeklyRhythm: data.weeklyRhythm }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.sessionType !== undefined && { sessionType: data.sessionType }),
      })
      .where(and(eq(subscriptions.instituteId, institute), eq(subscriptions.id, subscriptionId)));

    revalidatePath(`/admin/students/${sub.studentProfileId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}
