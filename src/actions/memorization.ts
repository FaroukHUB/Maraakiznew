"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  memorizationItems,
  memorizationReviews,
  computeNextReview,
  nextIntervalIndex,
} from "@/db/schema";
import { getSurah } from "@/lib/quran";

type ActionResult = { success: true } | { success: false; error: string };

type ReviewQuality = "weak" | "ok" | "strong";

// ─── Ajout d'une portion ─────────────────────────────────

export async function addMemorizationItem(data: {
  studentProfileId: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const surah = getSurah(data.surahNumber);
    if (!surah) return { success: false, error: "Sourate inconnue." };

    if (data.ayahStart < 1 || data.ayahEnd < data.ayahStart) {
      return { success: false, error: "Plage de versets invalide." };
    }
    if (data.ayahEnd > surah.ayahCount) {
      return {
        success: false,
        error: `${surah.name} compte ${surah.ayahCount} versets.`,
      };
    }

    // Une portion fraîchement mémorisée se révise dès le lendemain.
    const now = new Date();
    await db.insert(memorizationItems).values({
      studentProfileId: data.studentProfileId,
      surahNumber: data.surahNumber,
      ayahStart: data.ayahStart,
      ayahEnd: data.ayahEnd,
      memorizedAt: now,
      intervalIndex: 0,
      nextReviewAt: computeNextReview(now, 0),
      notes: data.notes?.trim() || null,
    });

    revalidatePath(`/admin/students/${data.studentProfileId}`);
    revalidatePath("/admin/memorization");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'ajout de la portion." };
  }
}

// ─── Enregistrement d'une révision ───────────────────────
//
// C'est ici que la répétition espacée se joue : la qualité de la
// récitation décide de l'intervalle avant la prochaine révision.

export async function recordReview(
  itemId: string,
  quality: ReviewQuality,
  options?: { sessionId?: string; notes?: string }
): Promise<ActionResult> {
  try {
    const item = await db.query.memorizationItems.findFirst({
      where: eq(memorizationItems.id, itemId),
    });
    if (!item) return { success: false, error: "Portion introuvable." };

    const now = new Date();
    const newIndex = nextIntervalIndex(item.intervalIndex, quality);

    await db.insert(memorizationReviews).values({
      itemId,
      quality,
      reviewedAt: now,
      sessionId: options?.sessionId ?? null,
      notes: options?.notes?.trim() || null,
    });

    await db
      .update(memorizationItems)
      .set({
        intervalIndex: newIndex,
        lastReviewedAt: now,
        nextReviewAt: computeNextReview(now, newIndex),
        updatedAt: now,
      })
      .where(eq(memorizationItems.id, itemId));

    revalidatePath(`/admin/students/${item.studentProfileId}`);
    revalidatePath("/admin/memorization");
    revalidatePath("/admin/dashboard");
    if (options?.sessionId) revalidatePath(`/admin/sessions/${options.sessionId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de la révision." };
  }
}

// ─── Retrait d'une portion ───────────────────────────────
//
// Désactivation plutôt que suppression : l'historique des révisions garde
// sa valeur même quand la portion sort du cycle.

export async function deactivateMemorizationItem(
  itemId: string
): Promise<ActionResult> {
  try {
    const item = await db.query.memorizationItems.findFirst({
      where: eq(memorizationItems.id, itemId),
    });
    if (!item) return { success: false, error: "Portion introuvable." };

    await db
      .update(memorizationItems)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(memorizationItems.id, itemId));

    revalidatePath(`/admin/students/${item.studentProfileId}`);
    revalidatePath("/admin/memorization");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du retrait de la portion." };
  }
}
