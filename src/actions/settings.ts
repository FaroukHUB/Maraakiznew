"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { settings, SETTING_KEYS } from "@/db/schema";
import { isValidTimezone } from "@/lib/timezones";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateSettings(values: {
  instituteName?: string;
  instituteTagline?: string;
  contactEmail?: string;
  whatsappNumber?: string;
  address?: string;
  invoiceFooter?: string;
  timezone?: string;
}): Promise<ActionResult> {
  try {
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

    for (const [key, value] of entries) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement des réglages." };
  }
}
