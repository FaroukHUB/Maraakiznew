"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability, requireInstitute } from "@/lib/tenant";
import {
  sessions,
  sessionNotes,
  sessionResources,
  sessionParticipants,
  subscriptions,
  CONSUMING_STATUSES,
  CAPABILITIES,
} from "@/db/schema";
import {
  getConsumedSessionCount,
  getSubscriptionIdsAffectedBySession,
} from "@/data/sessions";

// ─── Types ───────────────────────────────────────────────

type SessionStatus = "planned" | "completed" | "cancelled" | "student_absent" | "teacher_absent";

type ActionResult = { success: true } | { success: false; error: string };


// ─── Résolution du forfait d'une participante ────────────
//
// Une participante est débitée sur SON forfait du même programme que la
// séance. On privilégie le forfait actif ; à défaut, le plus récent.
// Sans forfait correspondant, on ne débite rien plutôt que de deviner.

async function resolveParticipantSubscription(
  studentProfileId: string,
  programId: string
): Promise<string | null> {
  const institute = await requireInstitute();
  const candidates = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.instituteId, institute),
      eq(subscriptions.studentProfileId, studentProfileId),
      eq(subscriptions.programId, programId)
    ),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  return (
    candidates.find((s) => s.status === "active")?.id ?? candidates[0]?.id ?? null
  );
}

/**
 * Referme tous les forfaits arrivés à leur terme après un changement de
 * statut de séance — celui du porteur comme ceux des participantes.
 */
async function closeCompletedSubscriptions(sessionId: string) {
  const institute = await requireInstitute();
  const affected = await getSubscriptionIdsAffectedBySession(sessionId);

  for (const subscriptionId of affected) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.instituteId, institute),
        eq(subscriptions.id, subscriptionId)
      ),
    });
    if (!sub || sub.status !== "active") continue;

    const consumed = await getConsumedSessionCount(sub.id);
    if (consumed >= sub.totalSessions) {
      await db
        .update(subscriptions)
        .set({
          status: "completed",
          closedAt: new Date(),
          closureReason: "all_sessions_consumed",
        })
        .where(
          and(
            eq(subscriptions.instituteId, institute),
            eq(subscriptions.id, sub.id)
          )
        );
    }
  }
}

// ─── Create ──────────────────────────────────────────────

export async function createSession(data: {
  subscriptionId: string;
  sessionNumber: number;
  scheduledAt: Date;
  durationMinutes: number;
  zoomLink?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    // Verify subscription exists and is active
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.instituteId, institute), eq(subscriptions.id, data.subscriptionId)),
    });
    if (!sub) return { success: false, error: "Forfait introuvable." };
    if (sub.status !== "active")
      return { success: false, error: "Ce forfait n'est plus actif." };

    /*
      Un forfait de huit séances n'en porte pas neuf.
      Sans ce garde-fou, la planification acceptait un rang au-delà du
      total : la séance était créée, puis consommée, et le forfait
      affichait « 9/8 ». Le forfait est ce qui ouvre le DROIT aux
      séances — le dépasser ne se fait pas par inadvertance.
      Ce commentaire fait foi.
    */
    if (data.sessionNumber > sub.totalSessions) {
      return {
        success: false,
        error: `Ce forfait ne compte que ${sub.totalSessions} séances, toutes déjà planifiées. Créez un nouveau forfait pour continuer.`,
      };
    }

    await db.insert(sessions).values({
      instituteId: institute,
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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)),
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
      .where(and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)));

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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)),
      with: { subscription: true },
    });
    if (!session) return { success: false, error: "Séance introuvable." };

    // Update session status
    await db
      .update(sessions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)));

    // Referme les forfaits arrivés à leur terme : le porteur ET les
    // participantes, qu'une séance de groupe débite aussi.
    await closeCompletedSubscriptions(sessionId);

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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    const existing = await db.query.sessionNotes.findFirst({
      where: and(eq(sessionNotes.instituteId, institute), eq(sessionNotes.sessionId, sessionId)),
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
        .where(and(eq(sessionNotes.instituteId, institute), eq(sessionNotes.id, existing.id)));
    } else {
      await db.insert(sessionNotes).values({
        instituteId: institute,
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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    // Remove existing participants for this session
    await db
      .delete(sessionParticipants)
      .where(and(eq(sessionParticipants.instituteId, institute), eq(sessionParticipants.sessionId, sessionId)));

    // Insert new participants, chacune rattachée à son propre forfait
    if (participants.length > 0) {
      const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)),
        with: { subscription: true },
      });
      if (!session) return { success: false, error: "Séance introuvable." };

      const rows = await Promise.all(
        participants.map(async (p) => ({
          sessionId,
          studentProfileId: p.studentProfileId,
          attendanceStatus: p.attendanceStatus,
          hasReplayAccess: p.hasReplayAccess,
          subscriptionId: await resolveParticipantSubscription(
            p.studentProfileId,
            session.subscription.programId
          ),
        }))
      );

      await db
        .insert(sessionParticipants)
        .values(rows.map((row) => ({ ...row, instituteId: institute })));
    }

    await closeCompletedSubscriptions(sessionId);

    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath("/admin/students");
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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    await db.insert(sessionResources).values({
      instituteId: institute,
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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    await db
      .delete(sessionResources)
      .where(and(eq(sessionResources.instituteId, institute), eq(sessionResources.id, resourceId)));

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
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.sessionsManage);
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)),
    });
    if (!session) return { success: false, error: "Séance introuvable." };
    if (session.status !== "planned")
      return {
        success: false,
        error: "Seules les séances planifiées peuvent être supprimées.",
      };

    await db.delete(sessions).where(and(eq(sessions.instituteId, institute), eq(sessions.id, sessionId)));

    revalidatePath("/admin/sessions");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
