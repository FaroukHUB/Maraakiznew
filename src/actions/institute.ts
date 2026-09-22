"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  instituteMembers,
  users,
  CAPABILITIES,
  type Capability,
} from "@/db/schema";
import { assertAdmin, NotAllowed } from "@/lib/guards";
import { assertCapability, getMyInstitutes, INSTITUTE_COOKIE } from "@/lib/tenant";

type ActionResult = { success: true } | { success: false; error: string };

type Role = "owner" | "manager" | "teacher" | "assistant";
const ROLES: Role[] = ["owner", "manager", "teacher", "assistant"];

function fail(error: unknown, fallback: string): ActionResult {
  if (error instanceof NotAllowed) return { success: false, error: error.message };
  return { success: false, error: fallback };
}

/**
 * Rattacher quelqu'un à l'établissement.
 *
 * ── Ce que cette action ne fait PAS ──
 *
 * Elle ne crée pas de compte. On rattache une personne qui en a déjà un :
 * créer un compte depuis ici reviendrait à en distribuer les accès sans
 * que personne n'ait choisi de mot de passe, et il faudrait l'acheminer.
 * Tant que l'envoi d'invitations n'existe pas, mieux vaut le dire
 * clairement que faire à moitié. Ce commentaire fait foi.
 *
 * Une élève ne devient pas membre de l'équipe : son compte sert à
 * apprendre, pas à administrer.
 */
export async function addInstituteMember(
  email: string,
  role: Role
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.instituteManage);
    if (!ROLES.includes(role)) return { success: false, error: "Rôle inconnu." };

    const clean = email.trim().toLowerCase();
    const person = await db.query.users.findFirst({
      where: eq(users.email, clean),
    });
    if (!person) {
      return {
        success: false,
        error:
          "Aucun compte ne porte cette adresse. La personne doit d'abord avoir un compte sur Maraakiz.",
      };
    }
    if (person.role === "student") {
      return {
        success: false,
        error:
          "Ce compte est celui d'une élève. Un compte élève ne peut pas administrer un établissement.",
      };
    }

    await db
      .insert(instituteMembers)
      .values({ instituteId: institute, userId: person.id, role, capabilities: [] })
      .onConflictDoUpdate({
        target: [instituteMembers.instituteId, instituteMembers.userId],
        set: { role, status: "active", updatedAt: new Date() },
      });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return fail(error, "Impossible de rattacher cette personne.");
  }
}

/**
 * Changer le rôle d'un membre, ou ses droits supplémentaires.
 *
 * Un établissement garde TOUJOURS au moins un propriétaire : sans lui,
 * plus personne ne peut rattacher qui que ce soit, et l'établissement
 * devient impossible à administrer. Ce commentaire fait foi.
 */
export async function setMemberRole(
  userId: string,
  role: Role,
  extra: Capability[] = []
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.instituteManage);
    if (!ROLES.includes(role)) return { success: false, error: "Rôle inconnu." };

    const known = Object.values(CAPABILITIES) as string[];
    const cleaned = [...new Set(extra)].filter((c) => known.includes(c));

    if (role !== "owner" && (await isLastOwner(institute, userId))) {
      return {
        success: false,
        error: "C'est le dernier propriétaire : nommez-en un autre d'abord.",
      };
    }

    const [updated] = await db
      .update(instituteMembers)
      .set({ role, capabilities: cleaned, updatedAt: new Date() })
      .where(
        and(
          eq(instituteMembers.instituteId, institute),
          eq(instituteMembers.userId, userId)
        )
      )
      .returning({ userId: instituteMembers.userId });

    if (!updated) return { success: false, error: "Membre introuvable." };

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return fail(error, "Impossible de modifier ce membre.");
  }
}

/**
 * Retirer quelqu'un de l'équipe.
 *
 * L'appartenance passe à « suspendue » : on ne l'efface pas, pour que
 * l'historique — qui a créé quoi, qui a pointé quelle séance — garde un
 * sens. L'accès, lui, cesse aussitôt : `getActiveInstitute` ne retient
 * que les appartenances actives.
 */
export async function revokeInstituteMember(userId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.instituteManage);

    if (await isLastOwner(institute, userId)) {
      return {
        success: false,
        error: "C'est le dernier propriétaire : nommez-en un autre d'abord.",
      };
    }

    const [updated] = await db
      .update(instituteMembers)
      .set({ status: "suspended", updatedAt: new Date() })
      .where(
        and(
          eq(instituteMembers.instituteId, institute),
          eq(instituteMembers.userId, userId)
        )
      )
      .returning({ userId: instituteMembers.userId });

    if (!updated) return { success: false, error: "Membre introuvable." };

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return fail(error, "Impossible de retirer ce membre.");
  }
}

/**
 * Choisir l'établissement sur lequel on travaille.
 *
 * Le cookie ne donne AUCUN accès : il ne fait que choisir parmi les
 * appartenances déjà vérifiées en base (voir `lib/tenant.ts`). Un cookie
 * fabriqué à la main désigne un établissement dont on n'est pas membre,
 * et ne change donc rien. Ce commentaire fait foi.
 */
export async function switchInstitute(instituteId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const mine = await getMyInstitutes();
    if (!mine.some((i) => i.id === instituteId)) {
      return { success: false, error: "Vous n'appartenez pas à cet établissement." };
    }

    (await cookies()).set(INSTITUTE_COOKIE, instituteId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return fail(error, "Impossible de changer d'établissement.");
  }
}

/** Reste-t-il un autre propriétaire actif que celui-ci ? */
async function isLastOwner(instituteId: string, userId: string): Promise<boolean> {
  const owners = await db.query.instituteMembers.findMany({
    where: and(
      eq(instituteMembers.instituteId, instituteId),
      eq(instituteMembers.role, "owner"),
      eq(instituteMembers.status, "active")
    ),
    columns: { userId: true },
  });
  return owners.length === 1 && owners[0].userId === userId;
}
