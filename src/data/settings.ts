import { db } from "@/db";
import { settings, SETTING_KEYS } from "@/db/schema";

export type InstituteSettings = {
  instituteName: string;
  instituteTagline: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  invoiceFooter: string;
};

const DEFAULTS: InstituteSettings = {
  instituteName: "Maraakiz",
  instituteTagline: "",
  contactEmail: "",
  whatsappNumber: "",
  address: "",
  invoiceFooter: "",
};

/**
 * Réglages de l'institut, avec valeurs par défaut.
 *
 * Une clé absente vaut sa valeur par défaut : l'application doit
 * fonctionner sur une base vierge, sans étape de configuration préalable.
 */
export async function getSettings(): Promise<InstituteSettings> {
  const rows = await db.query.settings.findMany();
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));

  return {
    instituteName: byKey[SETTING_KEYS.instituteName] || DEFAULTS.instituteName,
    instituteTagline: byKey[SETTING_KEYS.instituteTagline] ?? DEFAULTS.instituteTagline,
    contactEmail: byKey[SETTING_KEYS.contactEmail] ?? DEFAULTS.contactEmail,
    whatsappNumber: byKey[SETTING_KEYS.whatsappNumber] ?? DEFAULTS.whatsappNumber,
    address: byKey[SETTING_KEYS.address] ?? DEFAULTS.address,
    invoiceFooter: byKey[SETTING_KEYS.invoiceFooter] ?? DEFAULTS.invoiceFooter,
  };
}

/** Numéro WhatsApp au format attendu par wa.me : chiffres seulement. */
export function whatsappLink(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}
