"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, studentProfiles, mentionForScore } from "@/db/schema";
import {
  computeCertificateBasis,
  nextCertificateReference,
} from "@/data/certificates";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function createCertificate(data: {
  studentProfileId: string;
  title: string;
  programId?: string;
  comment?: string;
}): Promise<ActionResult> {
  try {
    if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };

    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, data.studentProfileId),
    });
    if (!student) return { success: false, error: "Élève introuvable." };

    const { basis, overallScore } = await computeCertificateBasis(
      data.studentProfileId,
      data.programId ?? null
    );

    const [created] = await db
      .insert(certificates)
      .values({
        studentProfileId: data.studentProfileId,
        programId: data.programId || null,
        title: data.title.trim(),
        comment: data.comment?.trim() || null,
        basis,
        overallScore,
        mention: mentionForScore(overallScore) as
          | "passable"
          | "bien"
          | "tres_bien"
          | "excellent",
        status: "draft",
      })
      .returning();

    revalidatePath("/admin/certificates");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la préparation du diplôme." };
  }
}

/** Recalcule les justificatifs — brouillon seulement. */
export async function refreshCertificate(id: string): Promise<ActionResult> {
  try {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
    });
    if (!certificate) return { success: false, error: "Diplôme introuvable." };
    if (certificate.status !== "draft") {
      return {
        success: false,
        error: "Un diplôme délivré est figé. Ses justificatifs ne se recalculent plus.",
      };
    }

    const { basis, overallScore } = await computeCertificateBasis(
      certificate.studentProfileId,
      certificate.programId
    );

    await db
      .update(certificates)
      .set({
        basis,
        overallScore,
        mention: mentionForScore(overallScore) as
          | "passable"
          | "bien"
          | "tres_bien"
          | "excellent",
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id));

    revalidatePath(`/admin/certificates/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du recalcul." };
  }
}

export async function updateCertificateComment(
  id: string,
  comment: string
): Promise<ActionResult> {
  try {
    await db
      .update(certificates)
      .set({ comment: comment.trim() || null, updatedAt: new Date() })
      .where(eq(certificates.id, id));

    revalidatePath(`/admin/certificates/${id}`);
    revalidatePath("/student/certificates");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}

// ─── Délivrance ──────────────────────────────────────────
//
// La référence est attribuée ici, une fois pour toutes.

export async function issueCertificate(id: string): Promise<ActionResult> {
  try {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
    });
    if (!certificate) return { success: false, error: "Diplôme introuvable." };
    if (certificate.status !== "draft") {
      return { success: false, error: "Ce diplôme est déjà délivré." };
    }

    const now = new Date();
    const reference = await nextCertificateReference(now.getFullYear());

    await db
      .update(certificates)
      .set({ status: "issued", reference, issuedOn: now, updatedAt: now })
      .where(eq(certificates.id, id));

    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/certificates/${id}`);
    revalidatePath("/student/certificates");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la délivrance du diplôme." };
  }
}

// ─── Révocation ──────────────────────────────────────────
//
// Un diplôme ne se supprime jamais après délivrance : une erreur se
// corrige en révoquant, avec un motif. Un document disparu sans trace est
// pire qu'un document erroné.

export async function revokeCertificate(
  id: string,
  reason: string
): Promise<ActionResult> {
  try {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
    });
    if (!certificate) return { success: false, error: "Diplôme introuvable." };
    if (!reason.trim()) {
      return { success: false, error: "Un motif de révocation est obligatoire." };
    }

    await db
      .update(certificates)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        revocationReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id));

    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/certificates/${id}`);
    revalidatePath("/student/certificates");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la révocation." };
  }
}

export async function deleteCertificate(id: string): Promise<ActionResult> {
  try {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, id),
    });
    if (!certificate) return { success: false, error: "Diplôme introuvable." };
    if (certificate.status !== "draft") {
      return {
        success: false,
        error: "Un diplôme délivré ne se supprime pas. Révoquez-le pour garder la trace.",
      };
    }

    await db.delete(certificates).where(eq(certificates.id, id));

    revalidatePath("/admin/certificates");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
