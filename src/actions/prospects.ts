"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import { prospects, appointments, users, studentProfiles, CAPABILITIES } from "@/db/schema";

type ActionResult =
  | { success: true; id?: string; tempPassword?: string }
  | { success: false; error: string };

type ProspectStatus = "new" | "contacted" | "trial_scheduled" | "converted" | "lost";

// ─── Prospects ───────────────────────────────────────────

export async function createProspect(data: {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  programId?: string;
  declaredLevel?: "debutant" | "intermediaire" | "avance";
  notes?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    if (!data.name.trim()) return { success: false, error: "Le nom est obligatoire." };
    if (!data.email?.trim() && !data.phone?.trim()) {
      return {
        success: false,
        error: "Un email ou un téléphone est nécessaire pour recontacter la personne.",
      };
    }

    const [created] = await db
      .insert(prospects)
      .values({
        instituteId: institute,
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        source: data.source?.trim() || null,
        programId: data.programId || null,
        declaredLevel: data.declaredLevel ?? null,
        notes: data.notes?.trim() || null,
        status: "new",
      })
      .returning();

    revalidatePath("/admin/prospects");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du prospect." };
  }
}

export async function updateProspect(
  id: string,
  data: {
    status?: ProspectStatus;
    notes?: string | null;
    lostReason?: string | null;
    source?: string | null;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const prospect = await db.query.prospects.findFirst({
      where: and(eq(prospects.instituteId, institute), eq(prospects.id, id)),
    });
    if (!prospect) return { success: false, error: "Prospect introuvable." };

    // On ne repasse pas « converted » à la main : seule la conversion
    // effective peut poser ce statut, parce qu'elle crée un compte.
    if (data.status === "converted" && prospect.status !== "converted") {
      return {
        success: false,
        error: "Utilisez la conversion pour inscrire ce prospect : elle crée son compte.",
      };
    }
    if (data.status === "lost" && !data.lostReason?.trim() && !prospect.lostReason) {
      return { success: false, error: "Indiquez pourquoi ce prospect n'a pas donné suite." };
    }

    await db
      .update(prospects)
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
        ...(data.source !== undefined && { source: data.source }),
        updatedAt: new Date(),
      })
      .where(and(eq(prospects.instituteId, institute), eq(prospects.id, id)));

    revalidatePath("/admin/prospects");
    revalidatePath(`/admin/prospects/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du prospect." };
  }
}

// ─── Conversion ──────────────────────────────────────────
//
// Crée l'utilisatrice et son profil, puis marque le prospect comme
// converti en gardant le lien. Le prospect n'est jamais supprimé : c'est
// ce qui permet de savoir d'où vient chaque élève.

export async function convertProspect(
  id: string,
  data: { email: string; password: string }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const prospect = await db.query.prospects.findFirst({
      where: and(eq(prospects.instituteId, institute), eq(prospects.id, id)),
    });
    if (!prospect) return { success: false, error: "Prospect introuvable." };
    if (prospect.status === "converted") {
      return { success: false, error: "Ce prospect est déjà inscrit." };
    }
    if (!data.email.trim()) return { success: false, error: "Un email est nécessaire." };
    if (data.password.length < 8) {
      return { success: false, error: "Le mot de passe doit faire au moins 8 caractères." };
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email.trim()),
    });
    if (existing) return { success: false, error: "Cet email est déjà utilisé." };

    const { hash } = await import("bcryptjs");
    const passwordHash = await hash(data.password, 10);

    const [user] = await db
      .insert(users)
      .values({
        email: data.email.trim(),
        passwordHash,
        name: prospect.name,
        role: "student",
      })
      .returning();

    const [profile] = await db
      .insert(studentProfiles)
      .values({
        instituteId: institute,
        userId: user.id,
        localPhone: prospect.phone,
        arabicReadingLevel: prospect.declaredLevel ?? "debutant",
        notes: prospect.notes,
      })
      .returning();

    await db
      .update(prospects)
      .set({
        status: "converted",
        convertedStudentProfileId: profile.id,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(prospects.instituteId, institute), eq(prospects.id, id)));

    // Les rendez-vous du prospect suivent l'élève.
    await db
      .update(appointments)
      .set({ studentProfileId: profile.id })
      .where(and(eq(appointments.instituteId, institute), eq(appointments.prospectId, id)));

    // C'est l'inscription qui rend la récompense de parrainage acquise.
    const { markReferralEarned } = await import("@/actions/referrals");
    await markReferralEarned(id, profile.id);

    revalidatePath("/admin/prospects");
    revalidatePath("/admin/students");
    return { success: true, id: profile.id };
  } catch {
    return { success: false, error: "Erreur lors de la conversion du prospect." };
  }
}

export async function deleteProspect(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const prospect = await db.query.prospects.findFirst({
      where: and(eq(prospects.instituteId, institute), eq(prospects.id, id)),
    });
    if (!prospect) return { success: false, error: "Prospect introuvable." };
    if (prospect.status === "converted") {
      return {
        success: false,
        error: "Un prospect inscrit ne se supprime pas : il retrace l'origine de l'élève.",
      };
    }

    await db.delete(prospects).where(and(eq(prospects.instituteId, institute), eq(prospects.id, id)));
    revalidatePath("/admin/prospects");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

// ─── Rendez-vous ─────────────────────────────────────────

export async function createAppointment(data: {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  prospectId?: string;
  studentProfileId?: string;
  meetingLink?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };
    if (!data.prospectId && !data.studentProfileId) {
      return { success: false, error: "Rattachez le rendez-vous à un prospect ou à une élève." };
    }
    if (data.prospectId && data.studentProfileId) {
      return { success: false, error: "Un rendez-vous concerne un prospect OU une élève, pas les deux." };
    }

    const scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return { success: false, error: "Date invalide." };
    }
    if (data.durationMinutes <= 0) {
      return { success: false, error: "La durée doit être positive." };
    }

    const [created] = await db
      .insert(appointments)
      .values({
        instituteId: institute,
        title: data.title.trim(),
        scheduledAt,
        durationMinutes: data.durationMinutes,
        prospectId: data.prospectId || null,
        studentProfileId: data.studentProfileId || null,
        meetingLink: data.meetingLink?.trim() || null,
        notes: data.notes?.trim() || null,
        status: "scheduled",
      })
      .returning();

    // Poser un rendez-vous fait avancer le prospect dans le parcours.
    if (data.prospectId) {
      const prospect = await db.query.prospects.findFirst({
      where: and(eq(prospects.instituteId, institute), eq(prospects.id, data.prospectId)),
      });
      if (prospect && (prospect.status === "new" || prospect.status === "contacted")) {
        await db
          .update(prospects)
          .set({ status: "trial_scheduled", updatedAt: new Date() })
          .where(and(eq(prospects.instituteId, institute), eq(prospects.id, data.prospectId)));
      }
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/prospects");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la création du rendez-vous." };
  }
}

export async function setAppointmentStatus(
  id: string,
  status: "scheduled" | "done" | "cancelled" | "no_show"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(appointments.instituteId, institute), eq(appointments.id, id)));

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/prospects");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    await db.delete(appointments).where(and(eq(appointments.instituteId, institute), eq(appointments.id, id)));
    revalidatePath("/admin/appointments");
    revalidatePath("/admin/prospects");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
