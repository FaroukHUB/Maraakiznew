"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  groups,
  groupMembers,
  sessions,
  sessionParticipants,
  subscriptions,
} from "@/db/schema";
import { getGroupMemberIds } from "@/data/groups";

// ─── Types ───────────────────────────────────────────────

type ActionResult = { success: true } | { success: false; error: string };

type GroupLevel = "debutant" | "intermediaire" | "avance";

// ─── Create ──────────────────────────────────────────────

export async function createGroup(data: {
  name: string;
  programId?: string;
  level?: GroupLevel;
  description?: string;
  schedule?: string;
  capacity?: number;
  studentProfileIds?: string[];
}): Promise<ActionResult> {
  try {
    if (!data.name.trim()) {
      return { success: false, error: "Le nom du groupe est obligatoire." };
    }

    const [group] = await db
      .insert(groups)
      .values({
        name: data.name.trim(),
        programId: data.programId || null,
        level: data.level ?? null,
        description: data.description || null,
        schedule: data.schedule || null,
        capacity: data.capacity ?? null,
        status: "active",
      })
      .returning();

    if (data.studentProfileIds?.length) {
      const result = await addGroupMembers(group.id, data.studentProfileIds);
      if (!result.success) return result;
    }

    revalidatePath("/admin/groups");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création du groupe." };
  }
}

// ─── Update ──────────────────────────────────────────────

export async function updateGroup(
  groupId: string,
  data: {
    name?: string;
    programId?: string | null;
    level?: GroupLevel | null;
    description?: string | null;
    schedule?: string | null;
    capacity?: number | null;
    status?: "active" | "archived";
  }
): Promise<ActionResult> {
  try {
    const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) return { success: false, error: "Groupe introuvable." };

    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: "Le nom du groupe est obligatoire." };
    }

    // Une capacité ne peut pas passer sous l'effectif déjà inscrit.
    if (data.capacity != null) {
      const memberCount = (await getGroupMemberIds(groupId)).length;
      if (data.capacity < memberCount) {
        return {
          success: false,
          error: `Le groupe compte déjà ${memberCount} élèves, la capacité ne peut pas être inférieure.`,
        };
      }
    }

    await db
      .update(groups)
      .set({
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.schedule !== undefined && { schedule: data.schedule }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.status !== undefined && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId));

    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${groupId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du groupe." };
  }
}

// ─── Members ─────────────────────────────────────────────

export async function addGroupMembers(
  groupId: string,
  studentProfileIds: string[]
): Promise<ActionResult> {
  try {
    const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) return { success: false, error: "Groupe introuvable." };

    const existing = await getGroupMemberIds(groupId);
    const toAdd = studentProfileIds.filter((id) => !existing.includes(id));
    if (toAdd.length === 0) return { success: true };

    if (group.capacity != null && existing.length + toAdd.length > group.capacity) {
      return {
        success: false,
        error: `Capacité maximale atteinte (${group.capacity} places).`,
      };
    }

    await db
      .insert(groupMembers)
      .values(toAdd.map((studentProfileId) => ({ groupId, studentProfileId })));

    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${groupId}`);
    // La fiche de chaque élève affiche ses groupes : sans cela, elle
    // continuerait de montrer l'ancienne liste.
    revalidatePath("/admin/students", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'ajout des élèves." };
  }
}

export async function removeGroupMember(
  groupId: string,
  studentProfileId: string
): Promise<ActionResult> {
  try {
    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.studentProfileId, studentProfileId)
        )
      );

    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${groupId}`);
    revalidatePath("/admin/students", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du retrait de l'élève." };
  }
}

// ─── Delete ──────────────────────────────────────────────
//
// Les séances rattachées ne sont pas supprimées : leur groupId est
// remis à null par la contrainte ON DELETE SET NULL. L'historique
// pédagogique et la consommation des forfaits restent intacts.

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  try {
    const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) return { success: false, error: "Groupe introuvable." };

    await db.delete(groups).where(eq(groups.id, groupId));

    revalidatePath("/admin/groups");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression du groupe." };
  }
}

// ─── Attach a session to a group ─────────────────────────
//
// Rattache une séance à un groupe et inscrit d'office les membres
// qui n'y figurent pas encore. C'est ce qui rend les groupes utiles :
// on ne re-coche pas chaque élève à chaque séance.
//
// Les participantes déjà enregistrées sont laissées telles quelles —
// leur statut de présence n'est jamais écrasé.

export async function attachSessionToGroup(
  sessionId: string,
  groupId: string
): Promise<ActionResult> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session) return { success: false, error: "Séance introuvable." };

    const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) });
    if (!group) return { success: false, error: "Groupe introuvable." };

    const memberIds = await getGroupMemberIds(groupId);
    if (memberIds.length === 0) {
      return { success: false, error: "Ce groupe ne contient aucune élève." };
    }

    const alreadyIn = await db.query.sessionParticipants.findMany({
      where: eq(sessionParticipants.sessionId, sessionId),
      columns: { studentProfileId: true },
    });
    const alreadyInIds = alreadyIn.map((p) => p.studentProfileId);
    const toInsert = memberIds.filter((id) => !alreadyInIds.includes(id));

    await db
      .update(sessions)
      .set({ groupId, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    if (toInsert.length > 0) {
      // Chaque membre est débitée sur SON forfait du même programme.
      const owner = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, session.subscriptionId),
      });

      const rows = await Promise.all(
        toInsert.map(async (studentProfileId) => {
          const candidates = owner
            ? await db.query.subscriptions.findMany({
                where: and(
                  eq(subscriptions.studentProfileId, studentProfileId),
                  eq(subscriptions.programId, owner.programId)
                ),
                orderBy: (s, { desc }) => [desc(s.createdAt)],
              })
            : [];

          return {
            sessionId,
            studentProfileId,
            attendanceStatus: "present" as const,
            hasReplayAccess: true,
            subscriptionId:
              candidates.find((c) => c.status === "active")?.id ??
              candidates[0]?.id ??
              null,
          };
        })
      );

      await db.insert(sessionParticipants).values(rows);
    }

    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath(`/admin/groups/${groupId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du rattachement au groupe." };
  }
}
