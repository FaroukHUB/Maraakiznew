"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  referralCodes,
  referrals,
  studentProfiles,
  prospects,
  generateReferralCode,
} from "@/db/schema";

type ActionResult =
  | { success: true; code?: string }
  | { success: false; error: string };

/**
 * Code de parrainage d'une élève, créé au besoin.
 *
 * Le code est stable une fois attribué : c'est ce que la marraine
 * communique, il ne doit pas changer sous ses pieds.
 */
export async function ensureReferralCode(
  studentProfileId: string
): Promise<ActionResult> {
  try {
    const existing = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.studentProfileId, studentProfileId),
    });
    if (existing) return { success: true, code: existing.code };

    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, studentProfileId),
    });
    if (!student) return { success: false, error: "Élève introuvable." };

    // En cas de collision, on dérive un nouveau code depuis l'essai précédent.
    let code = generateReferralCode(studentProfileId);
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await db.query.referralCodes.findFirst({
        where: eq(referralCodes.code, code),
      });
      if (!clash) break;
      code = generateReferralCode(code + attempt);
    }

    await db.insert(referralCodes).values({ studentProfileId, code });

    revalidatePath("/admin/referrals");
    return { success: true, code };
  } catch {
    return { success: false, error: "Erreur lors de la création du code." };
  }
}

/** Rattache un prospect à la marraine dont il a donné le code. */
export async function attachReferral(
  code: string,
  prospectId: string,
  rewardCents = 0
): Promise<ActionResult> {
  try {
    const entry = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, code.trim().toUpperCase()),
    });
    if (!entry) return { success: false, error: "Code de parrainage inconnu." };

    const prospect = await db.query.prospects.findFirst({
      where: eq(prospects.id, prospectId),
    });
    if (!prospect) return { success: false, error: "Prospect introuvable." };

    const already = await db.query.referrals.findFirst({
      where: eq(referrals.prospectId, prospectId),
    });
    if (already) return { success: false, error: "Ce prospect est déjà parrainé." };

    await db.insert(referrals).values({
      referrerProfileId: entry.studentProfileId,
      prospectId,
      rewardCents,
      status: "pending",
    });

    revalidatePath("/admin/referrals");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du rattachement." };
  }
}

/**
 * Marque les parrainages d'un prospect comme acquis, à son inscription.
 *
 * C'est l'inscription qui déclenche la récompense, pas la simple
 * recommandation : sinon le code se distribue sans limite pour des
 * demandes qui n'aboutissent jamais.
 */
export async function markReferralEarned(
  prospectId: string,
  referredProfileId: string
): Promise<ActionResult> {
  try {
    await db
      .update(referrals)
      .set({
        status: "earned",
        referredProfileId,
        earnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(referrals.prospectId, prospectId));

    revalidatePath("/admin/referrals");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la validation du parrainage." };
  }
}

export async function setReferralStatus(
  id: string,
  status: "pending" | "earned" | "rewarded" | "expired"
): Promise<ActionResult> {
  try {
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.id, id),
    });
    if (!referral) return { success: false, error: "Parrainage introuvable." };
    if (status === "rewarded" && referral.status !== "earned") {
      return {
        success: false,
        error: "Une récompense ne se remet que si elle est acquise.",
      };
    }

    await db
      .update(referrals)
      .set({
        status,
        rewardedAt: status === "rewarded" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(referrals.id, id));

    revalidatePath("/admin/referrals");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

export async function setReferralReward(
  id: string,
  reward: number
): Promise<ActionResult> {
  try {
    if (reward < 0) return { success: false, error: "La récompense ne peut pas être négative." };
    await db
      .update(referrals)
      .set({ rewardCents: Math.round(reward * 100), updatedAt: new Date() })
      .where(eq(referrals.id, id));

    revalidatePath("/admin/referrals");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}
