/**
 * Le salam et le moment de la journée.
 *
 * ── La règle ──
 *
 * Le salam ne change JAMAIS : « السلام عليكم » se dit à toute heure. Ce
 * qui change, c'est le vœu qui l'accompagne et l'ambiance de l'écran.
 * Écrire « Bonjour » à 23 h est le genre de détail qui fait qu'un outil
 * sonne faux. Ce commentaire fait foi.
 *
 * Les bornes suivent l'usage, pas l'astronomie : l'application ne connaît
 * ni le lieu ni l'heure du fajr, et prétendre le contraire serait faux.
 * Un institut qui voudrait caler ces bornes sur les horaires de prière
 * n'a qu'un tableau à modifier, ici.
 */

export type Moment = "aube" | "matin" | "apres_midi" | "soir" | "nuit";

export type Greeting = {
  moment: Moment;
  /** Le salam, en arabe. Identique à toute heure. */
  salamAr: string;
  /** Le salam, translittéré. */
  salamFr: string;
  /** Le vœu du moment, en français. */
  wishFr: string;
  /** Le vœu du moment, en arabe. */
  wishAr: string;
  /** Les deux teintes de l'aurore, en jetons du thème. */
  aurora: { a: string; b: string };
};

const MOMENTS: { from: number; moment: Moment; wishFr: string; wishAr: string }[] = [
  { from: 22, moment: "nuit", wishFr: "Bonne nuit", wishAr: "ليلة مباركة" },
  { from: 18, moment: "soir", wishFr: "Bonne soirée", wishAr: "مساء الخير" },
  { from: 12, moment: "apres_midi", wishFr: "Bon après-midi", wishAr: "طاب يومك" },
  { from: 7, moment: "matin", wishFr: "Bonne matinée", wishAr: "صباح الخير" },
  { from: 4, moment: "aube", wishFr: "Belle aube", wishAr: "صباح النور" },
  { from: 0, moment: "nuit", wishFr: "Bonne nuit", wishAr: "ليلة مباركة" },
];

/** Les deux halos du bandeau, par moment. Jetons du thème uniquement. */
const AURORA: Record<Moment, { a: string; b: string }> = {
  aube: { a: "var(--nourania)", b: "var(--primary)" },
  matin: { a: "var(--primary)", b: "var(--nourania)" },
  apres_midi: { a: "var(--primary)", b: "var(--quran)" },
  soir: { a: "var(--quran)", b: "var(--primary)" },
  nuit: { a: "var(--quran)", b: "var(--accent-foreground)" },
};

export function greetingFor(date: Date): Greeting {
  const hour = date.getHours();
  const entry = MOMENTS.find((m) => hour >= m.from) ?? MOMENTS[MOMENTS.length - 1];

  return {
    moment: entry.moment,
    salamAr: "السَّلَامُ عَلَيْكُمْ",
    salamFr: "As-salâmu ʿalaykum",
    wishFr: entry.wishFr,
    wishAr: entry.wishAr,
    aurora: AURORA[entry.moment],
  };
}

/**
 * Le prénom seul.
 *
 * « Aliyah Oum Salmaan » salué par son nom complet fait administratif.
 * On garde le premier mot, et on ne casse rien si le nom est vide.
 */
export function firstName(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? "").trim();
  if (trimmed === "") return "";
  return trimmed.split(/\s+/)[0];
}
