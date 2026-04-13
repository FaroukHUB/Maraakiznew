"use server";

import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  sessionNotes,
  sessionResources,
  sessionParticipants,
  subscriptions,
  CONSUMING_STATUSES,
} from "@/db/schema";
import { getConsumedSessionCount } from "@/data/sessions";

// ─── Types ───────────────────────────────────────────────

type SessionStatus = "planned" | "completed" | "cancelled" | "student_absent" | "teacher_absent";

type ActionResult = { success: true } | { success: false; error: string };

// ─── Create ──────────────────────────────────────────────

export async function createSession(data: {
  subscriptionId: string;
  sessionNumber: number;
  scheduledAt: Date;
  durationMinutes: number;
  zoomLink?: string;
}): Promise<ActionResult> {
  try {
    // Verify subscription exists and is active
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, data.subscriptionId),
    });
    if (!sub) return { success: false, error: "Forfait introuvable." };
    if (sub.status !== "active")
      return { success: false, error: "Ce forfait n'est plus actif." };

    await db.insert(sessions).values({
      subscriptionId: data.subscriptionId,
      sessionNumber: data.sessionNumber,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes,
      zoomLink: data.zoomLink || null,
      status: "planned",
    });

    revalidatePath("/admin/sessions");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de la création." };
  }
}

// ─── Update ──────────────────────────────────────────────

export async function updateSession(
  sessionId: string,
  data: {
    scheduledAt?: Date;
    durationMinutes?: number;
    zoomLink?: string;
  }
): Promise<ActionResult> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session) return { success: false, error: "Séance introuvable." };

    await db
      .update(sessions)
      .set({
        ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
        ...(data.durationMinutes && { durationMinutes: data.durationMinutes }),
        ...(data.zoomLink !== undefined && { zoomLink: data.zoomLink || null }),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    revalidatePath("/admin/sessions");
    revalidatePath(`/admin/sessions/${sessionId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

// ─── Update status ───────────────────────────────────────
//
// Règle de consommation (source de vérité : CONSUMING_STATUSES) :
//   completed + student_absent → consomment une séance du forfait
//   planned + cancelled + teacher_absent → ne consomment pas
//
// Quand toutes les séances sont consommées, le forfait passe
// automatiquement en "completed" avec closureReason = "all_sessions_consumed".

export async function updateSessionStatus(
  sessionId: string,
  newStatus: SessionStatus
): Promise<ActionResult> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: { subscription: true },
    });
    if (!session) return { success: false, error: "Séance introuvable." };

    // Update session status
    await db
      .update(sessions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    // Check if subscription should auto-close
    const sub = session.subscription;
    if (sub.status === "active") {
      const consumed = await getConsumedSessionCount(sub.id);
      if (consumed >= sub.totalSessions) {
        await db
          .update(subscriptions)
          .set({
            status: "completed",
            closedAt: new Date(),
            closureReason: "all_sessions_consumed",
          })
          .where(eq(subscriptions.id, sub.id));
      }
    }

    revalidatePath("/admin/sessions");
    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/sessions");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

// ─── Save notes ──────────────────────────────────────────
// Upsert : crée ou met à jour les notes d'une séance.

export async function saveSessionNotes(
  sessionId: string,
  data: {
    content?: string;
    stopReference?: string;
    homework?: string;
  }
): Promise<ActionResult> {
  try {
    const existing = await db.query.sessionNotes.findFirst({
      where: eq(sessionNotes.sessionId, sessionId),
    });

    if (existing) {
      await db
        .update(sessionNotes)
        .set({
          content: data.content ?? existing.content,
          stopReference: data.stopReference ?? existing.stopReference,
          homework: data.homework ?? existing.homework,
          updatedAt: new Date(),
        })
        .where(eq(sessionNotes.id, existing.id));
    } else {
      await db.insert(sessionNotes).values({
        sessionId,
        content: data.content || null,
        stopReference: data.stopReference || null,
        homework: data.homework || null,
      });
    }

    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath("/student/dashboard");
    revalidatePath("/student/sessions");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de l'enregistrement des notes." };
  }
}

// ─── Manage participants ─────────────────────────────────

export async function setSessionParticipants(
  sessionId: string,
  participants: {
    studentProfileId: string;
    attendanceStatus: "present" | "absent" | "late" | "excused";
    hasReplayAccess: boolean;
  }[]
): Promise<ActionResult> {
  try {
    // Remove existing participants for this session
    await db
      .delete(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId));

    // Insert new participants
    if (participants.length > 0) {
      await db.insert(sessionParticipants).values(
        participants.map((p) => ({
          sessionId,
          studentProfileId: p.studentProfileId,
          attendanceStatus: p.attendanceStatus,
          hasReplayAccess: p.hasReplayAccess,
        }))
      );
    }

    revalidatePath(`/admin/sessions/${sessionId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de la mise à jour des participantes." };
  }
}

// ─── Add session resource ────────────────────────────────

export async function addSessionResource(
  sessionId: string,
  data: {
    title: string;
    type: "replay_video" | "slide" | "summary" | "exercise" | "link";
    url: string;
    visibleTo: "all" | "participants_only";
  }
): Promise<ActionResult> {
  try {
    await db.insert(sessionResources).values({
      sessionId,
      title: data.title,
      type: data.type,
      url: data.url,
      visibleTo: data.visibleTo,
    });

    revalidatePath(`/admin/sessions/${sessionId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de l'ajout de la ressource." };
  }
}

// ─── Delete resource ─────────────────────────────────────

export async function deleteSessionResource(
  resourceId: string,
  sessionId: string
): Promise<ActionResult> {
  try {
    await db
      .delete(sessionResources)
      .where(eq(sessionResources.id, resourceId));

    revalidatePath(`/admin/sessions/${sessionId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

// ─── Delete session ──────────────────────────────────────
// Seules les séances "planned" peuvent être supprimées.

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session) return { success: false, error: "Séance introuvable." };
    if (session.status !== "planned")
      return {
        success: false,
        error: "Seules les séances planifiées peuvent être supprimées.",
      };

    await db.delete(sessions).where(eq(sessions.id, sessionId));

    revalidatePath("/admin/sessions");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
