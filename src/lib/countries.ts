/**
 * Les pays, et le fuseau qui va avec.
 *
 * ── Pourquoi le pays porte le fuseau ──
 *
 * Personne ne sait par cœur qu'on écrit « Africa/Casablanca ». Tout le
 * monde sait dans quel pays vit son élève. On demande donc le pays, et
 * le fuseau se déduit — modifiable ensuite, car la déduction n'est pas
 * toujours possible. Ce commentaire fait foi.
 *
 * `timezone: null` marque un pays à PLUSIEURS fuseaux : le Canada, les
 * États-Unis, la Russie, l'Australie, le Brésil, l'Indonésie. Pour
 * ceux-là, deviner serait faux une fois sur deux ; le fuseau reste à
 * choisir à la main.
 */

export type Country = {
  code: string;
  name: string;
  /** Fuseau unique du pays, ou null s'il en compte plusieurs. */
  timezone: string | null;
  region: string;
};

export const COUNTRIES: Country[] = [
  // ── Europe ──
  { code: "FR", name: "France", timezone: "Europe/Paris", region: "Europe" },
  { code: "BE", name: "Belgique", timezone: "Europe/Brussels", region: "Europe" },
  { code: "CH", name: "Suisse", timezone: "Europe/Zurich", region: "Europe" },
  { code: "LU", name: "Luxembourg", timezone: "Europe/Luxembourg", region: "Europe" },
  { code: "GB", name: "Royaume-Uni", timezone: "Europe/London", region: "Europe" },
  { code: "IE", name: "Irlande", timezone: "Europe/Dublin", region: "Europe" },
  { code: "ES", name: "Espagne", timezone: "Europe/Madrid", region: "Europe" },
  { code: "PT", name: "Portugal", timezone: "Europe/Lisbon", region: "Europe" },
  { code: "IT", name: "Italie", timezone: "Europe/Rome", region: "Europe" },
  { code: "DE", name: "Allemagne", timezone: "Europe/Berlin", region: "Europe" },
  { code: "NL", name: "Pays-Bas", timezone: "Europe/Amsterdam", region: "Europe" },
  { code: "SE", name: "Suède", timezone: "Europe/Stockholm", region: "Europe" },
  { code: "NO", name: "Norvège", timezone: "Europe/Oslo", region: "Europe" },
  { code: "DK", name: "Danemark", timezone: "Europe/Copenhagen", region: "Europe" },
  { code: "TR", name: "Turquie", timezone: "Europe/Istanbul", region: "Europe" },
  { code: "RU", name: "Russie", timezone: null, region: "Europe" },

  // ── Maghreb ──
  { code: "MA", name: "Maroc", timezone: "Africa/Casablanca", region: "Maghreb" },
  { code: "DZ", name: "Algérie", timezone: "Africa/Algiers", region: "Maghreb" },
  { code: "TN", name: "Tunisie", timezone: "Africa/Tunis", region: "Maghreb" },
  { code: "LY", name: "Libye", timezone: "Africa/Tripoli", region: "Maghreb" },
  { code: "MR", name: "Mauritanie", timezone: "Africa/Nouakchott", region: "Maghreb" },

  // ── Afrique ──
  { code: "SN", name: "Sénégal", timezone: "Africa/Dakar", region: "Afrique" },
  { code: "CI", name: "Côte d'Ivoire", timezone: "Africa/Abidjan", region: "Afrique" },
  { code: "ML", name: "Mali", timezone: "Africa/Bamako", region: "Afrique" },
  { code: "BF", name: "Burkina Faso", timezone: "Africa/Ouagadougou", region: "Afrique" },
  { code: "NE", name: "Niger", timezone: "Africa/Niamey", region: "Afrique" },
  { code: "GN", name: "Guinée", timezone: "Africa/Conakry", region: "Afrique" },
  { code: "NG", name: "Nigeria", timezone: "Africa/Lagos", region: "Afrique" },
  { code: "CM", name: "Cameroun", timezone: "Africa/Douala", region: "Afrique" },
  { code: "TD", name: "Tchad", timezone: "Africa/Ndjamena", region: "Afrique" },
  { code: "EG", name: "Égypte", timezone: "Africa/Cairo", region: "Afrique" },
  { code: "SD", name: "Soudan", timezone: "Africa/Khartoum", region: "Afrique" },
  { code: "SO", name: "Somalie", timezone: "Africa/Mogadishu", region: "Afrique" },
  { code: "DJ", name: "Djibouti", timezone: "Africa/Djibouti", region: "Afrique" },
  { code: "KE", name: "Kenya", timezone: "Africa/Nairobi", region: "Afrique" },
  { code: "KM", name: "Comores", timezone: "Indian/Comoro", region: "Afrique" },
  { code: "MG", name: "Madagascar", timezone: "Indian/Antananarivo", region: "Afrique" },
  { code: "ZA", name: "Afrique du Sud", timezone: "Africa/Johannesburg", region: "Afrique" },

  // ── Moyen-Orient ──
  { code: "SA", name: "Arabie saoudite", timezone: "Asia/Riyadh", region: "Moyen-Orient" },
  { code: "AE", name: "Émirats arabes unis", timezone: "Asia/Dubai", region: "Moyen-Orient" },
  { code: "QA", name: "Qatar", timezone: "Asia/Qatar", region: "Moyen-Orient" },
  { code: "KW", name: "Koweït", timezone: "Asia/Kuwait", region: "Moyen-Orient" },
  { code: "BH", name: "Bahreïn", timezone: "Asia/Bahrain", region: "Moyen-Orient" },
  { code: "OM", name: "Oman", timezone: "Asia/Muscat", region: "Moyen-Orient" },
  { code: "YE", name: "Yémen", timezone: "Asia/Aden", region: "Moyen-Orient" },
  { code: "JO", name: "Jordanie", timezone: "Asia/Amman", region: "Moyen-Orient" },
  { code: "LB", name: "Liban", timezone: "Asia/Beirut", region: "Moyen-Orient" },
  { code: "SY", name: "Syrie", timezone: "Asia/Damascus", region: "Moyen-Orient" },
  { code: "IQ", name: "Irak", timezone: "Asia/Baghdad", region: "Moyen-Orient" },
  { code: "PS", name: "Palestine", timezone: "Asia/Hebron", region: "Moyen-Orient" },

  // ── Asie ──
  { code: "PK", name: "Pakistan", timezone: "Asia/Karachi", region: "Asie" },
  { code: "IN", name: "Inde", timezone: "Asia/Kolkata", region: "Asie" },
  { code: "BD", name: "Bangladesh", timezone: "Asia/Dhaka", region: "Asie" },
  { code: "AF", name: "Afghanistan", timezone: "Asia/Kabul", region: "Asie" },
  { code: "MY", name: "Malaisie", timezone: "Asia/Kuala_Lumpur", region: "Asie" },
  { code: "ID", name: "Indonésie", timezone: null, region: "Asie" },
  { code: "TH", name: "Thaïlande", timezone: "Asia/Bangkok", region: "Asie" },
  { code: "CN", name: "Chine", timezone: "Asia/Shanghai", region: "Asie" },
  { code: "JP", name: "Japon", timezone: "Asia/Tokyo", region: "Asie" },

  // ── Amériques ──
  { code: "CA", name: "Canada", timezone: null, region: "Amériques" },
  { code: "US", name: "États-Unis", timezone: null, region: "Amériques" },
  { code: "MX", name: "Mexique", timezone: null, region: "Amériques" },
  { code: "BR", name: "Brésil", timezone: null, region: "Amériques" },
  { code: "AR", name: "Argentine", timezone: "America/Argentina/Buenos_Aires", region: "Amériques" },
  { code: "GF", name: "Guyane française", timezone: "America/Cayenne", region: "Amériques" },
  { code: "GP", name: "Guadeloupe", timezone: "America/Guadeloupe", region: "Amériques" },
  { code: "MQ", name: "Martinique", timezone: "America/Martinique", region: "Amériques" },

  // ── Océan Indien et Océanie ──
  { code: "RE", name: "La Réunion", timezone: "Indian/Reunion", region: "Océan Indien" },
  { code: "YT", name: "Mayotte", timezone: "Indian/Mayotte", region: "Océan Indien" },
  { code: "MU", name: "Maurice", timezone: "Indian/Mauritius", region: "Océan Indien" },
  { code: "AU", name: "Australie", timezone: null, region: "Océanie" },
  { code: "NC", name: "Nouvelle-Calédonie", timezone: "Pacific/Noumea", region: "Océanie" },
];

const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

export function countryRegions(): string[] {
  return [...new Set(COUNTRIES.map((country) => country.region))];
}

export function countryByCode(code: string | null | undefined): Country | null {
  return code ? (BY_CODE.get(code) ?? null) : null;
}

export function countryName(code: string | null | undefined): string {
  return countryByCode(code)?.name ?? "";
}

/**
 * Le fuseau à proposer pour un pays, ou null s'il faut le choisir.
 */
export function timezoneForCountry(code: string | null | undefined): string | null {
  return countryByCode(code)?.timezone ?? null;
}

/** Un pays qui compte plusieurs fuseaux : la déduction est impossible. */
export function hasSeveralTimezones(code: string | null | undefined): boolean {
  const country = countryByCode(code);
  return country !== null && country.timezone === null;
}

/**
 * L'adresse sur une ligne, pour l'affichage.
 *
 * Les champs vides sont sautés : une adresse à trous ne doit pas laisser
 * de virgules orphelines.
 */
export function formatAddress(parts: {
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}): string {
  const cityLine = [parts.postalCode, parts.city].filter(Boolean).join(" ");
  return [parts.addressLine, cityLine, countryName(parts.country)]
    .map((piece) => (piece ?? "").trim())
    .filter((piece) => piece !== "")
    .join(", ");
}
