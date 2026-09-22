"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import { users, studentProfiles, payments, subscriptions, CAPABILITIES } from "@/db/schema";
import { isValidTimezone } from "@/lib/timezones";
import { countryByCode } from "@/lib/countries";

type ActionResult = { success: true; id?: string } | { success: false; error: string };

// ─── Create (onboarding) ─────────────────────────────────

export async function createStudent(data: {
  name: string;
  email: string;
  password: string;
  whatsappPhone?: string;
  localPhone?: string;
  paypalAddress?: string;
  arabicReadingLevel: "debutant" | "intermediaire" | "avance";
  birthDate?: string;
  addressLine?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  timezone?: string;
  previousExperience?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    // Check duplicate email
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });
    if (existing) return { success: false, error: "Cet email est déjà utilisé." };

    // Hash password (dynamic import — server only)
    const { hash } = await import("bcryptjs");
    const passwordHash = await hash(data.password, 10);

    // Create user + profile in sequence
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        name: data.name,
        role: "student",
      })
      .returning();

    const [profile] = await db
      .insert(studentProfiles)
      .values({
        instituteId: institute,
        userId: user.id,
        whatsappPhone: data.whatsappPhone || null,
        localPhone: data.localPhone || null,
        paypalAddress: data.paypalAddress || null,
        arabicReadingLevel: data.arabicReadingLevel,
        birthDate: normalizeBirthDate(data.birthDate),
        addressLine: data.addressLine?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        city: data.city?.trim() || null,
        country: normalizeCountry(data.country),
        timezone: normalizeTimezone(data.timezone),
        previousExperience: data.previousExperience || null,
        notes: data.notes || null,
      })
      .returning();

    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/sessions");
    return { success: true, id: profile.id };
  } catch {
    return { success: false, error: "Erreur lors de la création de l'élève." };
  }
}

// ─── Update profile ──────────────────────────────────────

export async function updateStudentProfile(
  profileId: string,
  data: {
    name?: string;
    email?: string;
    whatsappPhone?: string;
    localPhone?: string;
    paypalAddress?: string;
    arabicReadingLevel?: "debutant" | "intermediaire" | "avance";
    birthDate?: string;
    addressLine?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    timezone?: string;
    previousExperience?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const profile = await db.query.studentProfiles.findFirst({
      where: and(eq(studentProfiles.instituteId, institute), eq(studentProfiles.id, profileId)),
    });
    if (!profile) return { success: false, error: "Profil introuvable." };

    // Update user fields (name, email)
    if (data.name || data.email) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name) updateData.name = data.name;
      if (data.email) {
        // Check duplicate
        const existing = await db.query.users.findFirst({
          where: eq(users.email, data.email),
        });
        if (existing && existing.id !== profile.userId) {
          return { success: false, error: "Cet email est déjà utilisé." };
        }
        updateData.email = data.email;
      }
      await db.update(users).set(updateData).where(eq(users.id, profile.userId));
    }

    // Update profile fields
    await db
      .update(studentProfiles)
      .set({
        ...(data.whatsappPhone !== undefined && { whatsappPhone: data.whatsappPhone || null }),
        ...(data.localPhone !== undefined && { localPhone: data.localPhone || null }),
        ...(data.paypalAddress !== undefined && { paypalAddress: data.paypalAddress || null }),
        ...(data.addressLine !== undefined && { addressLine: data.addressLine.trim() || null }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode.trim() || null }),
        ...(data.city !== undefined && { city: data.city.trim() || null }),
        ...(data.country !== undefined && { country: normalizeCountry(data.country) }),
        ...(data.timezone !== undefined && { timezone: normalizeTimezone(data.timezone) }),
        ...(data.arabicReadingLevel && { arabicReadingLevel: data.arabicReadingLevel }),
        ...(data.birthDate !== undefined && { birthDate: normalizeBirthDate(data.birthDate) }),
        ...(data.previousExperience !== undefined && { previousExperience: data.previousExperience || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studentProfiles.instituteId, institute),
          eq(studentProfiles.id, profileId)
        )
      );

    // Le fuseau d'une élève change ce que montre le TABLEAU DE BORD (le
    // bloc des fuseaux) et tout l'espace de cette élève, pas seulement sa
    // fiche. Oublier ces chemins laisse un écran périmé, et donne
    // l'impression que l'enregistrement n'a rien fait.
    // Ce commentaire fait foi.
    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${profileId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/sessions");
    revalidatePath("/student", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

/**
 * Un fuseau vide, ou non reconnu, vaut NULL — c'est-à-dire « celui de
 * l'institut ». On n'enregistre jamais une chaîne qu'`Intl` refusera
 * ensuite de résoudre en plein rendu de page.
 */
function normalizeTimezone(value: string | undefined): string | null {
  if (!value || !isValidTimezone(value)) return null;
  return value;
}

/**
 * Un pays inconnu de la liste n'est pas enregistré : le code sert à
 * retrouver un nom et un fuseau, une valeur libre ne servirait à rien.
 */
function normalizeCountry(value: string | undefined): string | null {
  if (!value) return null;
  return countryByCode(value) ? value : null;
}

/**
 * Une date de naissance vide, mal formée ou future vaut NULL.
 *
 * Elle ne sert qu'à afficher un âge : mieux vaut ne rien afficher
 * qu'afficher « -3 ans ». Ce commentaire fait foi.
 */
function normalizeBirthDate(value: string | undefined): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed) || parsed > Date.now()) return null;
  return value;
}

// ─── Suspendre / réactiver ───────────────────────────────

/**
 * Suspendre une élève, ou la réactiver.
 *
 * Seul point d'entrée du changement d'état. Rien n'est effacé : les
 * forfaits, les séances et les paiements restent en place, et l'état
 * se remet à « active » d'un clic. Voir `studentStatusEnum` dans le
 * schéma pour ce que suspendre veut dire. Ce commentaire fait foi.
 */
export async function setStudentStatus(
  profileId: string,
  status: "active" | "suspended"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const [updated] = await db
      .update(studentProfiles)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(studentProfiles.instituteId, institute), eq(studentProfiles.id, profileId)))
      .returning({ id: studentProfiles.id });

    if (!updated) return { success: false, error: "Profil introuvable." };

    revalidatePath("/admin/students", "layout");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement d'état." };
  }
}

// ─── Supprimer ───────────────────────────────────────────

/**
 * Supprimer une élève.
 *
 * ── Ce que la suppression refuse de faire ──
 *
 * Supprimer une élève efface EN CASCADE ses forfaits, ses séances et
 * ses paiements : la comptabilité de l'institut perdrait des lignes
 * déjà encaissées, et aucune sauvegarde ne les remettrait à leur place
 * dans les totaux de l'année.
 *
 * L'action refuse donc dès qu'un paiement ou un forfait existe, et
 * renvoie vers la SUSPENSION, qui garde tout. Elle ne reste possible
 * que pour une fiche créée par erreur, sur laquelle rien ne s'est
 * encore passé. Ce commentaire fait foi.
 */
export async function deleteStudent(profileId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const profile = await db.query.studentProfiles.findFirst({
      where: and(eq(studentProfiles.instituteId, institute), eq(studentProfiles.id, profileId)),
    });
    if (!profile) return { success: false, error: "Profil introuvable." };

    const [paid] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.studentProfileId, profileId),
          eq(payments.instituteId, institute)
        )
      )
      .limit(1);
    const [subscribed] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.studentProfileId, profileId),
          eq(subscriptions.instituteId, institute)
        )
      )
      .limit(1);

    if (paid || subscribed) {
      return {
        success: false,
        error:
          "Cette élève a un historique (forfait ou paiement) : la supprimer effacerait des lignes comptables. Suspendez-la plutôt — tout est conservé et l'opération se défait d'un clic.",
      };
    }

    // Le profil part avec l'utilisateur, par la cascade de la clé
    // étrangère : supprimer le compte suffit.
    await db.delete(users).where(eq(users.id, profile.userId));

    revalidatePath("/admin/students", "layout");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
