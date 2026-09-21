"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { skills, skillProgress, programs } from "@/db/schema";

// ─── Types ───────────────────────────────────────────────

type ActionResult = { success: true } | { success: false; error: string };

type SkillStatus = "not_started" | "in_progress" | "acquired";

// ─── Référentiel ─────────────────────────────────────────

export async function createSkill(data: {
  programId: string;
  label: string;
  unit?: string;
  code?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!data.label.trim()) {
      return { success: false, error: "L'intitulé de la compétence est obligatoire." };
    }

    const program = await db.query.programs.findFirst({
      where: eq(programs.id, data.programId),
    });
    if (!program) return { success: false, error: "Programme introuvable." };

    // La nouvelle compétence se place en fin de référentiel.
    const [last] = await db
      .select({ max: sql<number>`coalesce(max(${skills.sortOrder}), -1)` })
      .from(skills)
      .where(eq(skills.programId, data.programId));

    await db.insert(skills).values({
      programId: data.programId,
      label: data.label.trim(),
      unit: data.unit?.trim() || null,
      code: data.code?.trim() || null,
      description: data.description?.trim() || null,
      sortOrder: Number(last?.max ?? -1) + 1,
    });

    revalidatePath("/admin/skills");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création de la compétence." };
  }
}

export async function updateSkill(
  skillId: string,
  data: {
    label?: string;
    unit?: string | null;
    code?: string | null;
    description?: string | null;
    active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const skill = await db.query.skills.findFirst({ where: eq(skills.id, skillId) });
    if (!skill) return { success: false, error: "Compétence introuvable." };

    if (data.label !== undefined && !data.label.trim()) {
      return { success: false, error: "L'intitulé de la compétence est obligatoire." };
    }

    await db
      .update(skills)
      .set({
        ...(data.label !== undefined && { label: data.label.trim() }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.active !== undefined && { active: data.active }),
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skillId));

    revalidatePath("/admin/skills");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de la compétence." };
  }
}

/**
 * Déplace une compétence dans le référentiel en échangeant son rang avec
 * sa voisine. L'ordre du référentiel est pédagogique, il doit rester
 * modifiable sans tout ressaisir.
 */
export async function moveSkill(
  skillId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const skill = await db.query.skills.findFirst({ where: eq(skills.id, skillId) });
    if (!skill) return { success: false, error: "Compétence introuvable." };

    const siblings = await db.query.skills.findMany({
      where: eq(skills.programId, skill.programId),
      orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.createdAt)],
    });

    const index = siblings.findIndex((s) => s.id === skillId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return { success: true };

    const neighbour = siblings[targetIndex];

    await db
      .update(skills)
      .set({ sortOrder: neighbour.sortOrder, updatedAt: new Date() })
      .where(eq(skills.id, skill.id));
    await db
      .update(skills)
      .set({ sortOrder: skill.sortOrder, updatedAt: new Date() })
      .where(eq(skills.id, neighbour.id));

    revalidatePath("/admin/skills");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du déplacement de la compétence." };
  }
}

/**
 * Supprime une compétence du référentiel.
 *
 * Refuse la suppression si des élèves l'ont déjà travaillée : on ne
 * réécrit pas leur historique. Dans ce cas, la désactiver (active = false)
 * la retire du référentiel tout en gardant les validations passées.
 */
export async function deleteSkill(skillId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const [used] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skillProgress)
      .where(eq(skillProgress.skillId, skillId));

    if (Number(used?.count ?? 0) > 0) {
      return {
        success: false,
        error: `Cette compétence est déjà validée ou en cours chez ${used.count} élève(s). Désactivez-la plutôt que de la supprimer.`,
      };
    }

    await db.delete(skills).where(eq(skills.id, skillId));

    revalidatePath("/admin/skills");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de la compétence." };
  }
}

// ─── Acquis d'une élève ──────────────────────────────────

/**
 * Fixe le statut d'une compétence pour une élève.
 *
 * "not_started" supprime la ligne : l'absence de ligne vaut non commencée,
 * on ne garde pas de trace vide.
 *
 * sessionId, quand il est fourni, enregistre la séance où la validation a
 * eu lieu. Il n'est posé que sur un passage à "acquired" — c'est la date
 * d'acquisition qui a un sens pédagogique, pas celle du dernier clic.
 */
export async function setSkillStatus(
  studentProfileId: string,
  skillId: string,
  status: SkillStatus,
  sessionId?: string
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const existing = await db.query.skillProgress.findFirst({
      where: and(
        eq(skillProgress.studentProfileId, studentProfileId),
        eq(skillProgress.skillId, skillId)
      ),
    });

    if (status === "not_started") {
      if (existing) {
        await db.delete(skillProgress).where(eq(skillProgress.id, existing.id));
      }
    } else if (existing) {
      const becomesAcquired = status === "acquired" && existing.status !== "acquired";
      await db
        .update(skillProgress)
        .set({
          status,
          ...(becomesAcquired && {
            validatedAt: new Date(),
            ...(sessionId && { sessionId }),
          }),
          ...(status === "in_progress" && { validatedAt: null }),
          updatedAt: new Date(),
        })
        .where(eq(skillProgress.id, existing.id));
    } else {
      await db.insert(skillProgress).values({
        studentProfileId,
        skillId,
        status,
        sessionId: status === "acquired" ? sessionId ?? null : null,
        validatedAt: status === "acquired" ? new Date() : null,
      });
    }

    revalidatePath(`/admin/students/${studentProfileId}`);
    revalidatePath("/admin/dashboard");
    if (sessionId) revalidatePath(`/admin/sessions/${sessionId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de l'acquis." };
  }
}
