import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, SETTING_KEYS } from "@/db/schema";
import { INSTITUTE_TIMEZONE_FALLBACK, isValidTimezone } from "@/lib/timezones";

export type InstituteSettings = {
  instituteName: string;
  instituteTagline: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  invoiceFooter: string;
  timezone: string;
};

const DEFAULTS: InstituteSettings = {
  instituteName: "Maraakiz",
  instituteTagline: "",
  contactEmail: "",
  whatsappNumber: "",
  address: "",
  invoiceFooter: "",
  timezone: INSTITUTE_TIMEZONE_FALLBACK,
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
    timezone: readTimezone(byKey[SETTING_KEYS.timezone]),
  };
}

/**
 * Le fuseau de l'institut, seul.
 *
 * Les pages n'ont presque jamais besoin des autres réglages : cette
 * fonction évite de charger tout le bloc pour une seule chaîne.
 */
export async function getInstituteTimezone(): Promise<string> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, SETTING_KEYS.timezone),
  });
  return readTimezone(row?.value ?? undefined);
}

/**
 * Un fuseau enregistré peut être vide, ou devenu invalide si la base IANA
 * a changé. Dans les deux cas on retombe sur celui de l'institut plutôt
 * que de laisser `Intl` lever une exception en plein rendu.
 */
function readTimezone(value: string | undefined): string {
  return value && isValidTimezone(value) ? value : INSTITUTE_TIMEZONE_FALLBACK;
}

/** Numéro WhatsApp au format attendu par wa.me : chiffres seulement. */
export function whatsappLink(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}
