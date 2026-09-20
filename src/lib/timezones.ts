/**
 * Les fuseaux horaires.
 *
 * ── Le problème que cela règle ──
 *
 * L'enseignante est à Paris, l'élève à Montréal. Une séance enregistrée
 * à 18 h doit se lire 18 h chez l'enseignante et 12 h chez l'élève —
 * la même séance, pas deux heures différentes. L'instant est stocké en
 * UTC dans la base ; ce sont les AFFICHAGES qui portent un fuseau.
 *
 * ── La règle ──
 *
 * Aucun affichage de date ou d'heure ne se fait sans fuseau explicite.
 * Sans `timeZone`, `Intl` prend celui du processus — UTC sur un serveur
 * d'hébergement — et une séance de 18 h à Paris s'affiche 16 h pour tout
 * le monde. Ce commentaire fait foi : `lib/datetime.ts` n'expose aucune
 * fonction qui n'exige pas un fuseau.
 */

/** Utilisé quand l'institut n'a rien réglé. */
export const INSTITUTE_TIMEZONE_FALLBACK = "Europe/Paris";

export type TimezoneOption = {
  id: string;
  /** Ville, telle qu'on la nomme en français. */
  label: string;
  /** Regroupement pour la liste déroulante. */
  region: string;
};

/**
 * Une liste courte, choisie pour le public de l'institut, plutôt que les
 * 400 fuseaux de la base IANA : une liste qu'on peut parcourir des yeux
 * vaut mieux qu'une liste exhaustive qu'on subit. Un fuseau absent reste
 * accepté s'il est valide — voir `isValidTimezone`.
 */
export const TIMEZONES: TimezoneOption[] = [
  { id: "Europe/Paris", label: "Paris", region: "Europe" },
  { id: "Europe/Brussels", label: "Bruxelles", region: "Europe" },
  { id: "Europe/London", label: "Londres", region: "Europe" },
  { id: "Europe/Madrid", label: "Madrid", region: "Europe" },
  { id: "Europe/Berlin", label: "Berlin", region: "Europe" },
  { id: "Europe/Zurich", label: "Genève", region: "Europe" },
  { id: "Europe/Istanbul", label: "Istanbul", region: "Europe" },
  { id: "Europe/Moscow", label: "Moscou", region: "Europe" },

  { id: "Africa/Casablanca", label: "Casablanca", region: "Maghreb" },
  { id: "Africa/Algiers", label: "Alger", region: "Maghreb" },
  { id: "Africa/Tunis", label: "Tunis", region: "Maghreb" },
  { id: "Africa/Tripoli", label: "Tripoli", region: "Maghreb" },
  { id: "Africa/Nouakchott", label: "Nouakchott", region: "Maghreb" },

  { id: "Africa/Dakar", label: "Dakar", region: "Afrique" },
  { id: "Africa/Abidjan", label: "Abidjan", region: "Afrique" },
  { id: "Africa/Bamako", label: "Bamako", region: "Afrique" },
  { id: "Africa/Lagos", label: "Lagos", region: "Afrique" },
  { id: "Africa/Cairo", label: "Le Caire", region: "Afrique" },
  { id: "Africa/Khartoum", label: "Khartoum", region: "Afrique" },
  { id: "Africa/Nairobi", label: "Nairobi", region: "Afrique" },
  { id: "Indian/Comoro", label: "Moroni", region: "Afrique" },
  { id: "Indian/Mayotte", label: "Mamoudzou", region: "Afrique" },
  { id: "Indian/Reunion", label: "Saint-Denis (La Réunion)", region: "Afrique" },

  { id: "Asia/Riyadh", label: "La Mecque / Riyad", region: "Moyen-Orient" },
  { id: "Asia/Amman", label: "Amman", region: "Moyen-Orient" },
  { id: "Asia/Beirut", label: "Beyrouth", region: "Moyen-Orient" },
  { id: "Asia/Damascus", label: "Damas", region: "Moyen-Orient" },
  { id: "Asia/Baghdad", label: "Bagdad", region: "Moyen-Orient" },
  { id: "Asia/Qatar", label: "Doha", region: "Moyen-Orient" },
  { id: "Asia/Dubai", label: "Dubaï", region: "Moyen-Orient" },
  { id: "Asia/Kuwait", label: "Koweït", region: "Moyen-Orient" },
  { id: "Asia/Jerusalem", label: "Al-Qods", region: "Moyen-Orient" },

  { id: "Asia/Karachi", label: "Karachi", region: "Asie" },
  { id: "Asia/Dhaka", label: "Dacca", region: "Asie" },
  { id: "Asia/Jakarta", label: "Jakarta", region: "Asie" },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", region: "Asie" },

  { id: "America/Montreal", label: "Montréal", region: "Amériques" },
  { id: "America/New_York", label: "New York", region: "Amériques" },
  { id: "America/Chicago", label: "Chicago", region: "Amériques" },
  { id: "America/Denver", label: "Denver", region: "Amériques" },
  { id: "America/Los_Angeles", label: "Los Angeles", region: "Amériques" },
  { id: "America/Cayenne", label: "Cayenne", region: "Amériques" },
  { id: "America/Guadeloupe", label: "Pointe-à-Pitre", region: "Amériques" },
  { id: "America/Martinique", label: "Fort-de-France", region: "Amériques" },

  { id: "Australia/Sydney", label: "Sydney", region: "Océanie" },
  { id: "Pacific/Noumea", label: "Nouméa", region: "Océanie" },
];

const BY_ID = new Map(TIMEZONES.map((zone) => [zone.id, zone]));

/** Les régions, dans l'ordre où elles apparaissent dans la liste. */
export function timezoneRegions(): string[] {
  return [...new Set(TIMEZONES.map((zone) => zone.region))];
}

/**
 * Un identifiant IANA que l'environnement sait résoudre.
 *
 * On teste en construisant un formateur : c'est la seule vérification qui
 * dise la vérité pour l'environnement qui va effectivement afficher.
 */
export function isValidTimezone(id: string): boolean {
  if (!id) return false;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: id });
    return true;
  } catch {
    return false;
  }
}

/**
 * Le nom à afficher. Un fuseau hors liste garde son identifiant, rendu
 * lisible : « America/Sao_Paulo » devient « Sao Paulo ».
 */
export function zoneLabel(id: string): string {
  const known = BY_ID.get(id);
  if (known) return known.label;
  const city = id.split("/").pop() ?? id;
  return city.replace(/_/g, " ");
}

/**
 * Décalage d'un fuseau par rapport à UTC, en minutes, à un instant donné.
 *
 * Le décalage dépend de l'INSTANT, pas seulement du fuseau : l'heure
 * d'été existe. On demande donc à Intl le décalage de cette date-là.
 */
export function offsetMinutes(date: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const match = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    if (!match) return 0; // « GMT » tout court = UTC
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  } catch {
    return 0;
  }
}

/** Décalage entre deux fuseaux, en minutes, à un instant donné. */
export function offsetBetween(date: Date, timeZone: string, reference: string): number {
  return offsetMinutes(date, timeZone) - offsetMinutes(date, reference);
}

/**
 * Le décalage, écrit pour être lu : « +2 h », « −5 h 30 », « même heure ».
 * Le signe moins est le vrai (U+2212), pas un trait d'union.
 */
export function offsetLabel(date: Date, timeZone: string, reference: string): string {
  const minutes = offsetBetween(date, timeZone, reference);
  if (minutes === 0) return "même heure";
  const sign = minutes > 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return rest === 0 ? `${sign}${hours} h` : `${sign}${hours} h ${rest}`;
}

/**
 * Différence de QUANTIÈME entre deux fuseaux : −1, 0 ou +1.
 *
 * C'est ce qui permet d'écrire « demain » à côté d'une heure : 23 h à
 * Paris, c'est 1 h le lendemain à Dubaï, et l'oublier fait manquer des
 * séances.
 */
export function dayShift(date: Date, timeZone: string, reference: string): -1 | 0 | 1 {
  const dayIn = (tz: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, dateStyle: "short" }).format(date);
  const a = dayIn(timeZone);
  const b = dayIn(reference);
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

/** L'heure qu'il est dans ce fuseau, de 0 à 23. */
export function hourIn(date: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return Number(value);
}

/**
 * Heures où l'on ne dérange pas.
 *
 * 22 h – 7 h. Ce n'est pas une science : c'est une borne qui évite de
 * proposer une séance au milieu de la nuit de l'élève. L'institut peut
 * la déplacer ici, et nulle part ailleurs.
 */
export const QUIET_HOURS = { from: 22, to: 7 } as const;

export function isQuietHour(date: Date, timeZone: string): boolean {
  const hour = hourIn(date, timeZone);
  return hour >= QUIET_HOURS.from || hour < QUIET_HOURS.to;
}
