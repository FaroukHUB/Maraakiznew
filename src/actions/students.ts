"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, studentProfiles } from "@/db/schema";

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
  previousExperience?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
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
        userId: user.id,
        whatsappPhone: data.whatsappPhone || null,
        localPhone: data.localPhone || null,
        paypalAddress: data.paypalAddress || null,
        arabicReadingLevel: data.arabicReadingLevel,
        previousExperience: data.previousExperience || null,
        notes: data.notes || null,
      })
      .returning();

    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
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
    previousExperience?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  try {
    const profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, profileId),
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
        ...(data.arabicReadingLevel && { arabicReadingLevel: data.arabicReadingLevel }),
        ...(data.previousExperience !== undefined && { previousExperience: data.previousExperience || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.id, profileId));

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${profileId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}
