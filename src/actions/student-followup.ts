"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  studentRewards,
  studentNotes,
  type RewardKind,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";

type ActionResult = { success: true } | { success: false; error: string };

function refresh(profileId: string) {
  revalidatePath(`/admin/students/${profileId}`);
  revalidatePath("/admin/students");
}

// ─── Étoiles ─────────────────────────────────────────────

/**
 * Donner une étoile.
 *
 * Seul point d'entrée pour en ajouter une. Chaque appel empile un
 * événement daté : c'est de cette pile que sort le total (voir
 * `starBalance` dans le schéma). Ce commentaire fait foi.
 */
export async function grantReward(
  profileId: string,
  kind: RewardKind,
  reason?: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await db.insert(studentRewards).values({
      studentProfileId: profileId,
      kind,
      reason: reason?.trim() || null,
      grantedBy: admin.id ?? null,
    });
    refresh(profileId);
    return { success: true };
  } catch {
    return { success: false, error: "Impossible d'enregistrer l'étoile." };
  }
}

/**
 * Retirer la dernière étoile d'un motif.
 *
 * On EFFACE le dernier événement de ce motif au lieu d'en ajouter un
 * négatif : le « − » de l'écran corrige un clic de trop, il ne
 * sanctionne pas. Une pénalité, elle, s'ajoute avec `grantReward`.
 */
export async function revokeLastReward(
  profileId: string,
  kind: RewardKind
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const [last] = await db
      .select({ id: studentRewards.id })
      .from(studentRewards)
      .where(
        and(
          eq(studentRewards.studentProfileId, profileId),
          eq(studentRewards.kind, kind)
        )
      )
      .orderBy(desc(studentRewards.createdAt))
      .limit(1);

    if (!last) return { success: false, error: "Rien à retirer." };

    await db.delete(studentRewards).where(eq(studentRewards.id, last.id));
    refresh(profileId);
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de retirer l'étoile." };
  }
}

// ─── Notes privées ───────────────────────────────────────

export async function addStudentNote(
  profileId: string,
  content: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const text = content.trim();
    if (!text) return { success: false, error: "La note est vide." };

    await db.insert(studentNotes).values({
      studentProfileId: profileId,
      content: text,
      authorId: admin.id ?? null,
    });
    refresh(profileId);
    return { success: true };
  } catch {
    return { success: false, error: "Impossible d'enregistrer la note." };
  }
}

export async function updateStudentNote(
  noteId: string,
  content: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const text = content.trim();
    if (!text) return { success: false, error: "La note est vide." };

    const [updated] = await db
      .update(studentNotes)
      .set({ content: text, updatedAt: new Date() })
      .where(eq(studentNotes.id, noteId))
      .returning({ profileId: studentNotes.studentProfileId });

    if (!updated) return { success: false, error: "Note introuvable." };
    refresh(updated.profileId);
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de modifier la note." };
  }
}

export async function deleteStudentNote(noteId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const [removed] = await db
      .delete(studentNotes)
      .where(eq(studentNotes.id, noteId))
      .returning({ profileId: studentNotes.studentProfileId });

    if (!removed) return { success: false, error: "Note introuvable." };
    refresh(removed.profileId);
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer la note." };
  }
}
