"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { instituteSettings, CAPABILITIES, SETTING_KEYS } from "@/db/schema";
import { assertCapability } from "@/lib/tenant";
import { isValidTimezone } from "@/lib/timezones";
import { parseHex } from "@/lib/color";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateSettings(values: {
  instituteName?: string;
  instituteTagline?: string;
  contactEmail?: string;
  whatsappNumber?: string;
  address?: string;
  invoiceFooter?: string;
  timezone?: string;
  themePrimary?: string;
  themeAccent?: string;
  heroImage?: boolean;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    // Les réglages s'écrivent TOUJOURS dans la table par établissement,
    // jamais dans la table historique : celle-ci n'a qu'une ligne par
    // clé et serait partagée par tous les instituts.
    const institute = await assertCapability(CAPABILITIES.instituteManage);
    if (values.instituteName !== undefined && !values.instituteName.trim()) {
      return { success: false, error: "Le nom de l'institut est obligatoire." };
    }
    if (values.contactEmail?.trim() && !values.contactEmail.includes("@")) {
      return { success: false, error: "L'email de contact n'est pas valide." };
    }
    if (values.whatsappNumber?.trim()) {
      const digits = values.whatsappNumber.replace(/\D/g, "");
      if (digits.length < 8) {
        return {
          success: false,
          error: "Le numéro WhatsApp doit comporter au moins 8 chiffres, indicatif compris.",
        };
      }
    }

    if (values.timezone !== undefined && !isValidTimezone(values.timezone)) {
      return { success: false, error: "Ce fuseau horaire n'est pas reconnu." };
    }

    for (const [label, value] of [
      ["principale", values.themePrimary],
      ["seconde", values.themeAccent],
    ] as const) {
      if (value !== undefined && !parseHex(value)) {
        return { success: false, error: `La couleur ${label} n'est pas une couleur valide.` };
      }
    }

    const entries: [string, string][] = [];
    if (values.instituteName !== undefined)
      entries.push([SETTING_KEYS.instituteName, values.instituteName.trim()]);
    if (values.instituteTagline !== undefined)
      entries.push([SETTING_KEYS.instituteTagline, values.instituteTagline.trim()]);
    if (values.contactEmail !== undefined)
      entries.push([SETTING_KEYS.contactEmail, values.contactEmail.trim()]);
    if (values.whatsappNumber !== undefined)
      entries.push([SETTING_KEYS.whatsappNumber, values.whatsappNumber.trim()]);
    if (values.address !== undefined)
      entries.push([SETTING_KEYS.address, values.address.trim()]);
    if (values.invoiceFooter !== undefined)
      entries.push([SETTING_KEYS.invoiceFooter, values.invoiceFooter.trim()]);
    if (values.timezone !== undefined)
      entries.push([SETTING_KEYS.timezone, values.timezone]);
    if (values.themePrimary !== undefined)
      entries.push([SETTING_KEYS.themePrimary, values.themePrimary]);
    if (values.themeAccent !== undefined)
      entries.push([SETTING_KEYS.themeAccent, values.themeAccent]);
    if (values.heroImage !== undefined)
      entries.push([SETTING_KEYS.heroImage, values.heroImage ? "on" : "off"]);

    for (const [key, value] of entries) {
      await db
        .insert(instituteSettings)
        .values({ instituteId: institute, key, value })
        .onConflictDoUpdate({
          target: [instituteSettings.instituteId, instituteSettings.key],
          set: { value, updatedAt: new Date() },
        });
    }

    // Le fuseau change l'heure affichée sur TOUTES les pages, et les
    // couleurs vivent dans la disposition RACINE — qui sert aussi
    // l'écran de connexion, rendu statiquement. Sans cette dernière
    // ligne, la connexion garde les anciennes couleurs jusqu'à la
    // prochaine construction du site. Ce commentaire fait foi.
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/student", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement des réglages." };
  }
}
