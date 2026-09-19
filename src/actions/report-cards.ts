"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reportCards, studentProfiles } from "@/db/schema";
import { computeSnapshot } from "@/data/report-cards";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

// ─── Génération ──────────────────────────────────────────

export async function createReportCard(data: {
  studentProfileId: string;
  title: string;
  periodStart: string; // "2026-01-01"
  periodEnd: string;
}): Promise<ActionResult> {
  try {
    if (!data.title.trim()) {
      return { success: false, error: "Le titre du bulletin est obligatoire." };
    }

    const start = new Date(data.periodStart);
    const end = new Date(data.periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { success: false, error: "Dates de période invalides." };
    }
    if (end < start) {
      return { success: false, error: "La fin de période précède son début." };
    }

    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, data.studentProfileId),
    });
    if (!student) return { success: false, error: "Élève introuvable." };

    const snapshot = await computeSnapshot(data.studentProfileId, start, end);

    const [created] = await db
      .insert(reportCards)
      .values({
        studentProfileId: data.studentProfileId,
        title: data.title.trim(),
        periodStart: start,
        periodEnd: end,
        status: "draft",
        generatedAt: new Date(),
        ...snapshot,
      })
      .returning();

    revalidatePath("/admin/report-cards");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la génération du bulletin." };
  }
}

/**
 * Recalcule le constat d'un bulletin.
 *
 * Refusé sur un bulletin publié : le document remis à l'élève ne bouge
 * plus. Pour corriger un bulletin publié, il faut le repasser en
 * brouillon, ce qui le retire de l'espace élève — c'est visible, et c'est
 * voulu.
 */
export async function refreshReportCard(id: string): Promise<ActionResult> {
  try {
    const card = await db.query.reportCards.findFirst({
      where: eq(reportCards.id, id),
    });
    if (!card) return { success: false, error: "Bulletin introuvable." };
    if (card.status === "published") {
      return {
        success: false,
        error: "Un bulletin publié est figé. Repassez-le en brouillon pour le régénérer.",
      };
    }

    const snapshot = await computeSnapshot(
      card.studentProfileId,
      card.periodStart,
      card.periodEnd
    );

    await db
      .update(reportCards)
      .set({ ...snapshot, generatedAt: new Date(), updatedAt: new Date() })
      .where(eq(reportCards.id, id));

    revalidatePath(`/admin/report-cards/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du recalcul du bulletin." };
  }
}

// ─── Appréciation ────────────────────────────────────────

export async function updateReportCardComment(
  id: string,
  generalComment: string
): Promise<ActionResult> {
  try {
    const card = await db.query.reportCards.findFirst({
      where: eq(reportCards.id, id),
    });
    if (!card) return { success: false, error: "Bulletin introuvable." };

    await db
      .update(reportCards)
      .set({ generalComment: generalComment.trim() || null, updatedAt: new Date() })
      .where(eq(reportCards.id, id));

    revalidatePath(`/admin/report-cards/${id}`);
    revalidatePath("/student/report-cards");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de l'appréciation." };
  }
}

// ─── Publication ─────────────────────────────────────────

export async function setReportCardStatus(
  id: string,
  status: "draft" | "published"
): Promise<ActionResult> {
  try {
    const card = await db.query.reportCards.findFirst({
      where: eq(reportCards.id, id),
    });
    if (!card) return { success: false, error: "Bulletin introuvable." };

    await db
      .update(reportCards)
      .set({
        status,
        publishedAt: status === "published" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(reportCards.id, id));

    revalidatePath("/admin/report-cards");
    revalidatePath(`/admin/report-cards/${id}`);
    revalidatePath("/student/report-cards");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

// ─── Suppression ─────────────────────────────────────────

export async function deleteReportCard(id: string): Promise<ActionResult> {
  try {
    const card = await db.query.reportCards.findFirst({
      where: eq(reportCards.id, id),
    });
    if (!card) return { success: false, error: "Bulletin introuvable." };
    if (card.status === "published") {
      return {
        success: false,
        error: "Un bulletin publié ne se supprime pas. Repassez-le en brouillon d'abord.",
      };
    }

    await db.delete(reportCards).where(eq(reportCards.id, id));

    revalidatePath("/admin/report-cards");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression du bulletin." };
  }
}
