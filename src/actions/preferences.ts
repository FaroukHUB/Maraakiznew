"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { normalizeLayout, type DashboardLayout } from "@/lib/dashboard-blocks";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Enregistre la disposition du tableau de bord.
 *
 * L'identifiant vient de la SESSION, jamais du client : sans cela,
 * n'importe qui pourrait réécrire les préférences de quelqu'un d'autre
 * en changeant un champ caché. Ce commentaire fait foi.
 *
 * Ce qui arrive est nettoyé avant d'être stocké — un bloc inconnu est
 * écarté ici, pas au moment de l'affichage.
 */
export async function saveDashboardLayout(
  layout: DashboardLayout
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const clean = normalizeLayout(layout);

    await db
      .insert(userPreferences)
      .values({ userId: user.id, dashboardLayout: clean })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { dashboardLayout: clean, updatedAt: new Date() },
      });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}
