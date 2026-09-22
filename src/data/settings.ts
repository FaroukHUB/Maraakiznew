import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  settings,
  instituteSettings,
  DEFAULT_INSTITUTE_ID,
  SETTING_KEYS,
} from "@/db/schema";
import { getActiveInstitute } from "@/lib/tenant";
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
  /** « on » affiche l'image du bandeau, « off » la garde sans l'afficher. */
  heroImage: boolean;
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
  heroImage: true,
};

/**
 * L'établissement dont on lit les réglages.
 *
 * ── Pourquoi ce fichier n'exige PAS de session ──
 *
 * Les couleurs sont lues par la disposition racine, y compris sur
 * l'écran de connexion, et le nom de l'institut par la page publique
 * d'inscription. Exiger une session ici ferait échouer des pages qui
 * n'en ont pas — pour afficher une couleur.
 *
 * Sans session, c'est donc l'établissement D'ORIGINE qui parle : c'est
 * exactement ce que l'application affichait avant le multi-établissement,
 * et un réglage d'affichage n'est le secret de personne. Dès qu'une
 * personne est connectée, ce sont les réglages de SON établissement.
 * Une page publique propre à un établissement (lien d'inscription)
 * passera son identifiant en paramètre. Ce commentaire fait foi.
 */
async function resolveInstitute(instituteId?: string): Promise<string> {
  if (instituteId) return instituteId;
  const active = await getActiveInstitute();
  return active?.id ?? DEFAULT_INSTITUTE_ID;
}

/**
 * Les valeurs brutes, par clé, pour un établissement.
 *
 * La table historique `settings` reste la mémoire de l'établissement
 * d'origine : elle sert de repli pour lui SEUL, et jamais pour un autre
 * — sans quoi un nouvel institut hériterait du nom, des couleurs et du
 * jeton d'inscription de celui d'origine. Ce commentaire fait foi.
 */
async function readValues(instituteId: string): Promise<Record<string, string>> {
  const own = await db.query.instituteSettings.findMany({
    where: eq(instituteSettings.instituteId, instituteId),
  });
  const byKey: Record<string, string> = {};

  if (instituteId === DEFAULT_INSTITUTE_ID) {
    for (const row of await db.query.settings.findMany()) {
      byKey[row.key] = row.value ?? "";
    }
  }
  for (const row of own) {
    byKey[row.key] = row.value ?? "";
  }
  return byKey;
}

/**
 * Réglages de l'institut, avec valeurs par défaut.
 *
 * Une clé absente vaut sa valeur par défaut : l'application doit
 * fonctionner sur une base vierge, sans étape de configuration préalable.
 */
export async function getSettings(instituteId?: string): Promise<InstituteSettings> {
  const byKey = await readValues(await resolveInstitute(instituteId));

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
    heroImage: byKey[SETTING_KEYS.heroImage] !== "off",
  };
}

/**
 * Le fuseau de l'institut, seul.
 *
 * Les pages n'ont presque jamais besoin des autres réglages : cette
 * fonction évite de charger tout le bloc pour une seule chaîne.
 */
export async function getInstituteTimezone(instituteId?: string): Promise<string> {
  const institute = await resolveInstitute(instituteId);
  const own = await db.query.instituteSettings.findFirst({
    where: and(
      eq(instituteSettings.instituteId, institute),
      eq(instituteSettings.key, SETTING_KEYS.timezone)
    ),
  });
  if (own?.value) return readTimezone(own.value);

  if (institute === DEFAULT_INSTITUTE_ID) {
    const legacy = await db.query.settings.findFirst({
      where: eq(settings.key, SETTING_KEYS.timezone),
    });
    return readTimezone(legacy?.value ?? undefined);
  }
  return readTimezone(undefined);
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
    const byKey = await readValues(await resolveInstitute());
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

/**
 * Le jeton du lien d'inscription public, ou null si le lien est fermé.
 *
 * Seul point d'entrée pour le lire : la page publique et l'écran
 * d'administration passent tous deux par ici, et un jeton vide ou fait
 * d'espaces vaut « fermé ». Ce commentaire fait foi.
 */
export async function getRegistrationToken(
  instituteId?: string
): Promise<string | null> {
  const byKey = await readValues(await resolveInstitute(instituteId));
  const value = byKey[SETTING_KEYS.registrationToken]?.trim();
  return value ? value : null;
}

/**
 * L'établissement auquel appartient un jeton d'inscription.
 *
 * La page publique n'a pas de session : elle ne peut pas demander
 * « quel est mon établissement », elle doit le DÉDUIRE du jeton. Un
 * jeton inconnu ne renvoie rien — c'est ce qui ferme le lien.
 */
export async function findInstituteByRegistrationToken(
  token: string
): Promise<string | null> {
  const clean = token.trim();
  if (!clean) return null;

  const row = await db.query.instituteSettings.findFirst({
    where: and(
      eq(instituteSettings.key, SETTING_KEYS.registrationToken),
      eq(instituteSettings.value, clean)
    ),
  });
  if (row) return row.instituteId;

  // Repli sur la table historique : le jeton de l'établissement
  // d'origine y vit encore tant qu'il n'a pas été régénéré.
  const legacy = await db.query.settings.findFirst({
    where: and(
      eq(settings.key, SETTING_KEYS.registrationToken),
      eq(settings.value, clean)
    ),
  });
  return legacy ? DEFAULT_INSTITUTE_ID : null;
}
