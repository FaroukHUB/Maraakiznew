"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { staffMembers, payrollEntries } from "@/db/schema";
import { computePayroll } from "@/data/staff";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

type StaffRole = "teacher" | "secretary" | "supervisor" | "pedagogical_lead" | "manager";

export async function createStaffMember(data: {
  name: string;
  role: StaffRole;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  monthlyRate?: number;
  hiredOn?: string;
  supervisorId?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!data.name.trim()) return { success: false, error: "Le nom est obligatoire." };
    if (data.hourlyRate != null && data.monthlyRate != null) {
      return {
        success: false,
        error: "Choisissez un tarif horaire OU un forfait mensuel, pas les deux.",
      };
    }

    const [created] = await db
      .insert(staffMembers)
      .values({
        name: data.name.trim(),
        role: data.role,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        hourlyRateCents: data.hourlyRate != null ? Math.round(data.hourlyRate * 100) : null,
        monthlyRateCents: data.monthlyRate != null ? Math.round(data.monthlyRate * 100) : null,
        hiredOn: data.hiredOn ? new Date(data.hiredOn) : null,
        supervisorId: data.supervisorId || null,
        status: "active",
      })
      .returning();

    revalidatePath("/admin/staff");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du membre." };
  }
}

export async function updateStaffMember(
  id: string,
  data: {
    name?: string;
    role?: StaffRole;
    status?: "active" | "inactive";
    email?: string | null;
    phone?: string | null;
    hourlyRate?: number | null;
    monthlyRate?: number | null;
    supervisorId?: string | null;
    notes?: string | null;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const member = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.id, id),
    });
    if (!member) return { success: false, error: "Membre introuvable." };

    if (data.supervisorId === id) {
      return { success: false, error: "Un membre ne peut pas être son propre superviseur." };
    }

    await db
      .update(staffMembers)
      .set({
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.hourlyRate !== undefined && {
          hourlyRateCents: data.hourlyRate == null ? null : Math.round(data.hourlyRate * 100),
        }),
        ...(data.monthlyRate !== undefined && {
          monthlyRateCents: data.monthlyRate == null ? null : Math.round(data.monthlyRate * 100),
        }),
        ...(data.supervisorId !== undefined && { supervisorId: data.supervisorId }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updatedAt: new Date(),
      })
      .where(eq(staffMembers.id, id));

    revalidatePath("/admin/staff");
    revalidatePath(`/admin/staff/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

// ─── Paie ────────────────────────────────────────────────
//
// Générer un bulletin fige le montant calculé. Le marquer payé le
// verrouille : il ne se régénère plus si le tarif change ensuite.

export async function generatePayroll(
  staffMemberId: string,
  period: string
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const computed = await computePayroll(staffMemberId, period);
    if (!computed) return { success: false, error: "Membre introuvable." };

    const existing = await db.query.payrollEntries.findFirst({
      where: and(
        eq(payrollEntries.staffMemberId, staffMemberId),
        eq(payrollEntries.period, period)
      ),
    });

    if (existing?.status === "paid") {
      return {
        success: false,
        error: "Ce bulletin est déjà payé : son montant est figé.",
      };
    }

    if (existing) {
      await db
        .update(payrollEntries)
        .set({ ...computed, updatedAt: new Date() })
        .where(eq(payrollEntries.id, existing.id));
    } else {
      await db.insert(payrollEntries).values({
        staffMemberId,
        period,
        ...computed,
        status: "draft",
      });
    }

    revalidatePath("/admin/payroll");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du calcul de la paie." };
  }
}

export async function setPayrollStatus(
  id: string,
  status: "draft" | "paid"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    await db
      .update(payrollEntries)
      .set({
        status,
        paidOn: status === "paid" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(payrollEntries.id, id));

    revalidatePath("/admin/payroll");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

/** Attribue une séance à une enseignante. */
export async function assignSessionStaff(
  sessionId: string,
  staffMemberId: string | null
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const { sessions } = await import("@/db/schema");
    await db
      .update(sessions)
      .set({ staffMemberId, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath("/admin/supervision");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'attribution." };
  }
}
