"use server";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { settings, SETTING_KEYS, prospects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { getRegistrationToken } from "@/data/settings";
import { readLevel } from "@/lib/student-import";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Le lien d'inscription public.
 *
 * ── Ce que le formulaire public crée, et ce qu'il ne crée PAS ──
 *
 * Il crée un PROSPECT, jamais une élève. C'est la règle déjà écrite
 * dans `schema/prospects.ts` : un prospect n'a ni compte, ni forfait, ni
 * séance, et la conversion reste un geste de l'institut.
 *
 * L'alternative — créer directement une élève — donnerait à n'importe
 * qui le pouvoir d'ouvrir un compte de connexion sur ce site en
 * remplissant un formulaire trouvé dans un groupe WhatsApp. Le lien
 * public sert à RECEVOIR des demandes, pas à distribuer des accès.
 *
 * Fermer le lien (jeton effacé) fait disparaître l'adresse publique.
 * La régénérer invalide l'ancienne. Ce commentaire fait foi.
 */
export async function openRegistrationLink(): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  try {
    await requireAdmin();
    // 24 octets : impossible à deviner, et assez court pour tenir dans
    // un message sans être coupé.
    const token = randomBytes(24).toString("base64url");
    await writeToken(token);
    revalidatePath("/admin/students");
    revalidatePath("/admin/settings");
    return { success: true, token };
  } catch {
    return { success: false, error: "Impossible d'ouvrir le lien." };
  }
}

export async function closeRegistrationLink(): Promise<ActionResult> {
  try {
    await requireAdmin();
    await writeToken("");
    revalidatePath("/admin/students");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de fermer le lien." };
  }
}

async function writeToken(value: string) {
  await db
    .insert(settings)
    .values({ key: SETTING_KEYS.registrationToken, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * Le jeton donné vaut-il celui de l'institut ?
 *
 * La comparaison est à temps constant : comparer deux chaînes avec `===`
 * s'arrête au premier caractère différent, et le temps de réponse
 * laisserait deviner le jeton caractère par caractère.
 */
export async function checkRegistrationToken(candidate: string): Promise<boolean> {
  const token = await getRegistrationToken();
  if (!token || !candidate) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(candidate);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type PublicRegistration = {
  name: string;
  email: string;
  phone: string;
  level: string;
  message: string;
  /** Champ piège : rempli, c'est un robot. Voir plus bas. */
  website: string;
};

/**
 * Une demande d'inscription arrivée par le lien public.
 *
 * ── Ce qui protège ce formulaire ──
 *
 * Il est ouvert à tous : il n'a donc ni session, ni jeton d'utilisateur.
 * Trois choses le tiennent :
 *
 * 1. Le JETON du lien, sans lequel l'action refuse tout.
 * 2. Un champ PIÈGE, invisible à l'écran et rempli par les robots qui
 *    complètent tous les champs d'un formulaire. Rempli, la demande est
 *    acceptée en apparence et jetée en silence : dire « refusé »
 *    apprendrait au robot à contourner le piège.
 * 3. Un GARDE-FOU de doublon : la même adresse dans les dernières
 *    24 heures ne crée pas de seconde demande.
 *
 * Ce commentaire fait foi.
 */
export async function submitPublicRegistration(
  token: string,
  data: PublicRegistration
): Promise<ActionResult> {
  try {
    if (!(await checkRegistrationToken(token))) {
      return { success: false, error: "Ce lien d'inscription n'est plus valable." };
    }

    // Le piège : on répond « c'est enregistré » sans rien enregistrer.
    if (data.website.trim()) return { success: true };

    const name = data.name.trim().slice(0, 120);
    const email = data.email.trim().toLowerCase().slice(0, 200);

    if (name.length < 2) {
      return { success: false, error: "Merci d'indiquer votre nom." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { success: false, error: "Cette adresse email ne semble pas valide." };
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const already = await db.query.prospects.findFirst({
      where: and(eq(prospects.email, email), gte(prospects.createdAt, yesterday)),
    });
    if (already) return { success: true };

    await db.insert(prospects).values({
      name,
      email,
      phone: data.phone.replace(/[^\d+]/g, "").slice(0, 30) || null,
      source: "Lien d'inscription",
      status: "new",
      declaredLevel: readLevel(data.level),
      notes: data.message.trim().slice(0, 2000) || null,
    });

    revalidatePath("/admin/prospects");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "L'envoi n'a pas abouti. Réessayez dans un instant." };
  }
}
