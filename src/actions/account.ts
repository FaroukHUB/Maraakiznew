"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function changePassword(
  userId: string,
  data: { currentPassword: string; newPassword: string }
): Promise<ActionResult> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    const { compare, hash } = await import("bcryptjs");

    const valid = await compare(data.currentPassword, user.passwordHash);
    if (!valid) return { success: false, error: "Mot de passe actuel incorrect." };

    if (data.newPassword.length < 6) {
      return { success: false, error: "Le nouveau mot de passe doit faire au moins 6 caractères." };
    }

    const newHash = await hash(data.newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de mot de passe." };
  }
}
