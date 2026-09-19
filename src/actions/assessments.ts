"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, assessmentResults, studentProfiles } from "@/db/schema";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

type AssessmentType = "quiz" | "exam" | "placement" | "contest";
type Level = "debutant" | "intermediaire" | "avance";

// ─── Évaluation ──────────────────────────────────────────

export async function createAssessment(data: {
  title: string;
  type: AssessmentType;
  maxScore: number;
  heldOn: string;
  programId?: string;
  groupId?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.title.trim()) {
      return { success: false, error: "Le titre est obligatoire." };
    }
    if (!Number.isInteger(data.maxScore) || data.maxScore <= 0) {
      return { success: false, error: "Le barème doit être un entier positif." };
    }

    const heldOn = new Date(data.heldOn);
    if (Number.isNaN(heldOn.getTime())) {
      return { success: false, error: "Date invalide." };
    }

    const [created] = await db
      .insert(assessments)
      .values({
        title: data.title.trim(),
        type: data.type,
        maxScore: data.maxScore,
        heldOn,
        programId: data.programId || null,
        groupId: data.groupId || null,
        description: data.description?.trim() || null,
        status: "draft",
      })
      .returning();

    revalidatePath("/admin/assessments");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la création de l'évaluation." };
  }
}

export async function setAssessmentStatus(
  id: string,
  status: "draft" | "published"
): Promise<ActionResult> {
  try {
    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, id),
    });
    if (!assessment) return { success: false, error: "Évaluation introuvable." };

    await db
      .update(assessments)
      .set({ status, updatedAt: new Date() })
      .where(eq(assessments.id, id));

    revalidatePath("/admin/assessments");
    revalidatePath(`/admin/assessments/${id}`);
    revalidatePath("/student/assessments");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

export async function deleteAssessment(id: string): Promise<ActionResult> {
  try {
    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, id),
    });
    if (!assessment) return { success: false, error: "Évaluation introuvable." };
    if (assessment.status === "published") {
      return {
        success: false,
        error: "Une évaluation publiée ne se supprime pas. Repassez-la en brouillon d'abord.",
      };
    }

    await db.delete(assessments).where(eq(assessments.id, id));

    revalidatePath("/admin/assessments");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

// ─── Notation ────────────────────────────────────────────
//
// Saisir une note crée ou met à jour le résultat. Passer une note à null
// retire le résultat : l'élève redevient non évaluée, ce qui n'est pas
// la même chose qu'un zéro.

export async function setResult(
  assessmentId: string,
  studentProfileId: string,
  score: number | null,
  options?: { comment?: string; resultingLevel?: Level }
): Promise<ActionResult> {
  try {
    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, assessmentId),
    });
    if (!assessment) return { success: false, error: "Évaluation introuvable." };

    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, studentProfileId),
    });
    if (!student) return { success: false, error: "Élève introuvable." };

    const existing = await db.query.assessmentResults.findFirst({
      where: and(
        eq(assessmentResults.assessmentId, assessmentId),
        eq(assessmentResults.studentProfileId, studentProfileId)
      ),
    });

    if (score === null) {
      if (existing) {
        await db.delete(assessmentResults).where(eq(assessmentResults.id, existing.id));
      }
    } else {
      if (!Number.isInteger(score) || score < 0) {
        return { success: false, error: "La note doit être un entier positif ou nul." };
      }
      if (score > assessment.maxScore) {
        return {
          success: false,
          error: `La note ne peut pas dépasser le barème de ${assessment.maxScore}.`,
        };
      }

      const values = {
        score,
        comment: options?.comment?.trim() || null,
        resultingLevel: options?.resultingLevel ?? null,
        gradedAt: new Date(),
      };

      if (existing) {
        await db
          .update(assessmentResults)
          .set(values)
          .where(eq(assessmentResults.id, existing.id));
      } else {
        await db
          .insert(assessmentResults)
          .values({ assessmentId, studentProfileId, ...values });
      }
    }

    revalidatePath(`/admin/assessments/${assessmentId}`);
    revalidatePath(`/admin/students/${studentProfileId}`);
    revalidatePath("/student/assessments");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de la note." };
  }
}
