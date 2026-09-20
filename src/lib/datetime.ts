/**
 * Affichage des dates et des heures.
 *
 * ── La règle ──
 *
 * Toutes ces fonctions EXIGENT un fuseau. Aucune ne peut être appelée
 * sans, et c'est volontaire : sans `timeZone`, `Intl` prend celui du
 * processus. Sur un serveur d'hébergement, c'est UTC — et une séance de
 * 18 h à Paris s'affiche alors 16 h, pour tout le monde, sans que rien
 * n'ait l'air cassé. Ce commentaire fait foi.
 *
 * Côté administration, le fuseau est celui de l'institut. Côté élève,
 * c'est le sien. Aucun appel à `new Intl.DateTimeFormat` ne doit
 * subsister ailleurs dans l'application pour une date métier.
 */

const LOCALE = "fr-FR";

function format(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone }).format(date);
}

/**
 * Heures, minutes et secondes DANS un fuseau.
 *
 * `date.getHours()` donne l'heure du navigateur : juste pour une horloge
 * personnelle, faux dès qu'on affiche l'heure d'un autre endroit. Tout
 * affichage d'horloge passe par ici.
 */
export function clockParts(
  date: Date,
  timeZone: string
): { hours: string; minutes: string; seconds: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    (parts.find((p) => p.type === type)?.value ?? "00").padStart(2, "0");
  return { hours: get("hour"), minutes: get("minute"), seconds: get("second") };
}

/** « 18:00 » */
export function formatTime(date: Date, timeZone: string): string {
  return format(date, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** « 20/09/2026 » */
export function formatShortDate(date: Date, timeZone: string): string {
  return format(date, timeZone, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** « 20 sept. » */
export function formatDayMonth(date: Date, timeZone: string): string {
  return format(date, timeZone, { day: "numeric", month: "short" });
}

/** « 20 septembre 2026 » */
export function formatDate(date: Date, timeZone: string): string {
  return format(date, timeZone, { day: "numeric", month: "long", year: "numeric" });
}

/** « 20 sept. 2026 » */
export function formatDayMonthYear(date: Date, timeZone: string): string {
  return format(date, timeZone, { day: "numeric", month: "short", year: "numeric" });
}

/** « dimanche 20 septembre 2026 » */
export function formatLongDate(date: Date, timeZone: string): string {
  return format(date, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** « dim. 20 sept., 18:00 » */
export function formatDateTime(date: Date, timeZone: string): string {
  return format(date, timeZone, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** « dimanche 20 septembre, 18:00 » */
export function formatLongDateTime(date: Date, timeZone: string): string {
  return format(date, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** « dimanche 20 septembre 2026 à 18:00 » */
export function formatFullDateTime(date: Date, timeZone: string): string {
  return format(date, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** « 1 sept. 2026 → 30 sept. 2026 » */
export function formatPeriod(start: Date, end: Date, timeZone: string): string {
  return `${formatDayMonthYear(start, timeZone)} \u2192 ${formatDayMonthYear(end, timeZone)}`;
}

/** « septembre 2026 » */
export function formatMonth(date: Date, timeZone: string): string {
  return format(date, timeZone, { month: "long", year: "numeric" });
}

/**
 * Le mois d'un instant, au format « 2026-09 », DANS un fuseau.
 *
 * `toISOString().slice(0, 7)` donne le mois en UTC : le 1er octobre à
 * 00 h 30 à Paris est encore le 30 septembre en UTC, et la période
 * bascule un jour trop tôt.
 */
export function monthKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

/**
 * Le début du jour courant DANS un fuseau, exprimé en instant absolu.
 *
 * `setHours(0,0,0,0)` pose minuit dans le fuseau du serveur : sur un
 * hébergement en UTC, « aujourd'hui » commence alors à 2 h du matin à
 * Paris, et les deux premières heures de la journée manquent.
 */
export function startOfDayIn(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const iso = `${get("year")}-${get("month")}-${get("day")}T00:00:00`;

  // On part de minuit lu comme si c'était UTC, puis on retire le décalage
  // du fuseau à cet instant-là pour retomber sur le vrai instant.
  const asUtc = new Date(`${iso}Z`);
  const offset = offsetAt(asUtc, timeZone);
  return new Date(asUtc.getTime() - offset * 60_000);
}

/**
 * L'instant correspondant à une saisie « datetime-local », lue DANS un
 * fuseau donné.
 *
 * ── Le piège ──
 *
 * `new Date("2026-09-20T18:00")` interprète la saisie dans le fuseau du
 * NAVIGATEUR. Une enseignante en déplacement enregistrerait alors une
 * séance décalée de plusieurs heures, sans rien voir d'anormal à
 * l'écran. On lit donc la saisie comme une heure de paroi dans le fuseau
 * de l'institut. Ce commentaire fait foi.
 *
 * Deux passes : autour d'un changement d'heure, le décalage à appliquer
 * n'est pas celui de la date lue comme UTC. La seconde passe corrige.
 *
 * ── Les deux heures qui n'existent pas normalement ──
 *
 * Le jour du passage à l'heure d'hiver, une heure locale revient DEUX
 * fois ; le jour du passage à l'heure d'été, une heure locale n'existe
 * PAS. Le choix retenu, et vérifié par les tests :
 *
 *   - heure en double → la SECONDE occurrence (après le changement) ;
 *   - heure inexistante → l'instant décalé vers l'AVANT (02:30 devient
 *     03:30).
 *
 * Aucun de ces deux cas ne concerne une séance réelle — personne ne
 * programme un cours à 2 h 30 du matin — mais le comportement doit être
 * déterminé, pas laissé au hasard.
 */
export function instantFromLocalInput(
  value: string,
  timeZone: string
): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  const asUtc = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;

  const first = new Date(asUtc.getTime() - offsetAt(asUtc, timeZone) * 60_000);
  const corrected = new Date(asUtc.getTime() - offsetAt(first, timeZone) * 60_000);
  return corrected;
}

/**
 * L'inverse : la valeur à poser dans un champ « datetime-local » pour
 * qu'il affiche cet instant dans le fuseau demandé.
 */
export function localInputFromInstant(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function offsetAt(date: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value ?? "";
  const match = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}
