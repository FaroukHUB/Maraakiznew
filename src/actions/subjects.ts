"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import { programs, subscriptions, skills, slugify, CAPABILITIES } from "@/db/schema";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

// ─── Matières ────────────────────────────────────────────
//
// Une matière, c'est un programme : Nourania, Accompagnement Coran. La
// table existait, mais rien ne permettait d'en créer ou d'en modifier
// depuis l'application — il fallait passer par la base.
//
// Le slug est déduit du nom et doit rester unique : c'est lui qui relie
// une matière au code (libellés, seeds, imports éventuels).

export async function createSubject(data: {
  name: string;
  description?: string;
  defaultSessionCount: number;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.contentManage);
    if (!data.name.trim()) return { success: false, error: "Le nom est obligatoire." };
    if (!Number.isInteger(data.defaultSessionCount) || data.defaultSessionCount <= 0) {
      return { success: false, error: "Le nombre de séances par défaut doit être positif." };
    }

    const slug = slugify(data.name).replace(/-/g, "_").slice(0, 50);
    if (!slug) {
      return { success: false, error: "Ce nom ne permet pas de construire un identifiant." };
    }

    const existing = await db.query.programs.findFirst({
      where: and(eq(programs.instituteId, institute), eq(programs.slug, slug)),
    });
    if (existing) {
      return { success: false, error: "Une matière porte déjà ce nom." };
    }

    const [last] = await db
      .select({ max: sql<number>`coalesce(max(${programs.sortOrder}), 0)` })
      .from(programs)
      .where(eq(programs.instituteId, institute));

    const [created] = await db
      .insert(programs)
      .values({
        instituteId: institute,
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        defaultSessionCount: data.defaultSessionCount,
        sortOrder: Number(last?.max ?? 0) + 1,
        active: true,
      })
      .returning();

    revalidatePath("/admin/subjects");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la création de la matière." };
  }
}

export async function updateSubject(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    defaultSessionCount?: number;
    active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.contentManage);
    const program = await db.query.programs.findFirst({
      where: and(eq(programs.instituteId, institute), eq(programs.id, id))});
    if (!program) return { success: false, error: "Matière introuvable." };

    if (data.name !== undefined) {
      if (!data.name.trim()) return { success: false, error: "Le nom est obligatoire." };
      const slug = slugify(data.name).replace(/-/g, "_").slice(0, 50);
      const clash = await db.query.programs.findFirst({
      where: and(
        eq(programs.instituteId, institute),
        eq(programs.slug, slug), ne(programs.id, id)
      ),
      });
      if (clash) return { success: false, error: "Une matière porte déjà ce nom." };
    }

    if (data.defaultSessionCount !== undefined && data.defaultSessionCount <= 0) {
      return { success: false, error: "Le nombre de séances par défaut doit être positif." };
    }

    await db
      .update(programs)
      .set({
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.defaultSessionCount !== undefined && {
          defaultSessionCount: data.defaultSessionCount,
        }),
        ...(data.active !== undefined && { active: data.active }),
      })
      .where(and(eq(programs.instituteId, institute), eq(programs.id, id)));

    revalidatePath("/admin/subjects");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

/**
 * Supprime une matière.
 *
 * Refusé dès qu'un forfait ou une compétence s'y rattache : effacer la
 * matière rendrait illisibles les forfaits et le référentiel qui en
 * dépendent. La désactiver la retire des listes sans rien casser.
 */
export async function deleteSubject(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.contentManage);
    const [subs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.programId, id),
          eq(subscriptions.instituteId, institute)
        )
      );
    if (Number(subs?.count ?? 0) > 0) {
      return {
        success: false,
        error: `${subs.count} forfait(s) utilisent cette matière. Désactivez-la plutôt.`,
      };
    }

    const [skillCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(
        and(eq(skills.programId, id), eq(skills.instituteId, institute))
      );
    if (Number(skillCount?.count ?? 0) > 0) {
      return {
        success: false,
        error: `${skillCount.count} compétence(s) sont rattachées à cette matière. Désactivez-la plutôt.`,
      };
    }

    await db.delete(programs).where(and(eq(programs.instituteId, institute), eq(programs.id, id)));
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
