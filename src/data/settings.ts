import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, SETTING_KEYS } from "@/db/schema";
import { INSTITUTE_TIMEZONE_FALLBACK, isValidTimezone } from "@/lib/timezones";
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from "@/lib/theme";
import { parseHex } from "@/lib/color";

export type InstituteSettings = {
  instituteName: string;
  instituteTagline: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  invoiceFooter: string;
  timezone: string;
  themePrimary: string;
  themeAccent: string;
};

const DEFAULTS: InstituteSettings = {
  instituteName: "Maraakiz",
  instituteTagline: "",
  contactEmail: "",
  whatsappNumber: "",
  address: "",
  invoiceFooter: "",
  timezone: INSTITUTE_TIMEZONE_FALLBACK,
  themePrimary: DEFAULT_PRIMARY,
  themeAccent: DEFAULT_ACCENT,
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
    themePrimary: readColor(byKey[SETTING_KEYS.themePrimary], DEFAULT_PRIMARY),
    themeAccent: readColor(byKey[SETTING_KEYS.themeAccent], DEFAULT_ACCENT),
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

/**
 * Les deux couleurs du thème, seules.
 *
 * ── Pourquoi une fonction à part ──
 *
 * Elles sont lues par la disposition RACINE, à chaque page, y compris
 * l'écran de connexion. Si la base ne répond pas, on rend le thème par
 * défaut plutôt que de faire échouer toute l'application : une couleur
 * n'est pas une raison de ne plus rien afficher. Ce commentaire fait foi.
 */
export async function getThemeColors(): Promise<{ primary: string; accent: string }> {
  try {
    const rows = await db.query.settings.findMany();
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    return {
      primary: readColor(byKey[SETTING_KEYS.themePrimary], DEFAULT_PRIMARY),
      accent: readColor(byKey[SETTING_KEYS.themeAccent], DEFAULT_ACCENT),
    };
  } catch {
    return { primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT };
  }
}

/** Une couleur illisible par `parseHex` vaut sa valeur par défaut. */
function readColor(value: string | undefined, fallback: string): string {
  return value && parseHex(value) ? value : fallback;
}
