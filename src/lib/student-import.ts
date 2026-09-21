import { COUNTRIES } from "@/lib/countries";

/**
 * Reconnaître les colonnes d'un fichier d'élèves.
 *
 * ── Ce que « reconnaissance automatique » veut dire ici ──
 *
 * Pas un appel à un modèle : une table de synonymes et des règles de
 * normalisation, écrites et vérifiables. « Nom », « NOM COMPLET »,
 * « Full name », « الاسم » désignent la même colonne ; « débutante »,
 * « beginner » et « 1 » désignent le même niveau. C'est ce travail-là
 * qui fait gagner du temps, et il n'a pas besoin d'être devine.
 *
 * Ce qui n'est PAS reconnu reste visible : la correspondance proposée
 * est affichée et modifiable avant l'import, et rien n'est écrit avant
 * cette confirmation. Ce commentaire fait foi.
 */

export const IMPORT_FIELDS = [
  "name",
  "firstName",
  "lastName",
  "email",
  "whatsappPhone",
  "localPhone",
  "birthDate",
  "level",
  "country",
  "city",
  "postalCode",
  "addressLine",
  "previousExperience",
  "notes",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

export const FIELD_LABELS: Record<ImportField, string> = {
  name: "Nom complet",
  firstName: "Prénom",
  lastName: "Nom de famille",
  email: "Email",
  whatsappPhone: "WhatsApp",
  localPhone: "Téléphone local",
  birthDate: "Date de naissance",
  level: "Niveau",
  country: "Pays",
  city: "Ville",
  postalCode: "Code postal",
  addressLine: "Adresse",
  previousExperience: "Expérience",
  notes: "Remarque",
};

/** Les en-têtes reconnus, déjà normalisés (sans accent ni ponctuation). */
const HEADER_SYNONYMS: Record<ImportField, string[]> = {
  name: ["nom complet", "nom et prenom", "prenom et nom", "nom", "name", "full name", "eleve", "etudiant", "etudiante", "alumno", "الاسم"],
  firstName: ["prenom", "first name", "firstname", "given name"],
  lastName: ["nom de famille", "last name", "lastname", "surname", "family name"],
  email: ["email", "e mail", "mail", "courriel", "adresse email", "adresse mail", "البريد"],
  whatsappPhone: ["whatsapp", "whats app", "numero whatsapp", "tel whatsapp", "wa"],
  localPhone: ["telephone", "tel", "phone", "portable", "mobile", "numero", "telephone local", "الهاتف"],
  birthDate: ["date de naissance", "naissance", "ne le", "nee le", "birth date", "birthdate", "date of birth", "dob", "anniversaire"],
  level: ["niveau", "level", "niveau de lecture", "niveau arabe", "grade", "المستوى"],
  country: ["pays", "country", "nationalite", "البلد"],
  city: ["ville", "city", "commune", "المدينة"],
  postalCode: ["code postal", "cp", "postal code", "zip", "zip code"],
  addressLine: ["adresse", "address", "rue", "adresse postale"],
  previousExperience: ["experience", "parcours", "experience passee", "background"],
  notes: ["remarque", "remarques", "note", "notes", "commentaire", "commentaires", "observation", "observations"],
};

/** Minuscules, sans accent, sans ponctuation : « Nom Complet* » → « nom complet ». */
export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

/**
 * La correspondance proposée : pour chaque colonne, le champ deviné.
 *
 * Une colonne non reconnue vaut `null` — elle sera ignorée, et l'écran
 * le montre. Un même champ n'est attribué qu'une fois : deux colonnes
 * « Téléphone » ne rempliraient pas deux fois le même champ.
 */
export function guessMapping(headers: string[]): (ImportField | null)[] {
  const used = new Set<ImportField>();
  const normalized = headers.map(normalizeHeader);
  const mapping: (ImportField | null)[] = headers.map(() => null);

  // Deux passes : d'abord les correspondances EXACTES, ensuite les
  // approchantes. Sans cela, une colonne « Nom de famille » pourrait
  // capter « nom » avant que la vraie colonne « Nom » ne soit vue.
  for (const exact of [true, false]) {
    for (let column = 0; column < normalized.length; column += 1) {
      if (mapping[column]) continue;
      const header = normalized[column];
      if (!header) continue;

      for (const field of IMPORT_FIELDS) {
        if (used.has(field)) continue;
        const synonyms = HEADER_SYNONYMS[field];
        const hit = exact
          ? synonyms.includes(header)
          : synonyms.some((synonym) => header.includes(synonym));
        if (hit) {
          mapping[column] = field;
          used.add(field);
          break;
        }
      }
    }
  }

  return mapping;
}

export type ImportedStudent = {
  name: string;
  email: string;
  whatsappPhone: string;
  localPhone: string;
  birthDate: string;
  arabicReadingLevel: "debutant" | "intermediaire" | "avance";
  country: string;
  city: string;
  postalCode: string;
  addressLine: string;
  previousExperience: string;
  notes: string;
};

export type ImportRow = {
  line: number;
  values: ImportedStudent;
  /** Ce qui empêche l'import de cette ligne. */
  errors: string[];
  /** Ce qui a été corrigé ou ignoré, sans bloquer. */
  warnings: string[];
};

/**
 * Une ligne du fichier devient une élève — ou une ligne en erreur.
 *
 * Seul point d'entrée de la conversion. Une ligne sans nom ou sans email
 * valide est REFUSÉE plutôt que devinée : inventer une adresse créerait
 * un compte auquel personne ne peut se connecter.
 */
export function readRow(
  cells: string[],
  mapping: (ImportField | null)[],
  line: number
): ImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const raw = {} as Record<ImportField, string>;

  mapping.forEach((field, column) => {
    if (!field) return;
    raw[field] = (cells[column] ?? "").trim();
  });

  const name =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();
  if (!name) errors.push("nom manquant");

  const email = (raw.email ?? "").trim().toLowerCase();
  if (!email) errors.push("email manquant");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.push(`email illisible (« ${raw.email} »)`);
  }

  const birthDate = readDate(raw.birthDate);
  if (raw.birthDate && !birthDate) {
    warnings.push(`date de naissance ignorée (« ${raw.birthDate} »)`);
  }

  const level = readLevel(raw.level);
  if (raw.level && !level) {
    warnings.push(`niveau non reconnu (« ${raw.level} »), débutante par défaut`);
  }

  const country = readCountry(raw.country);
  if (raw.country && !country) {
    warnings.push(`pays non reconnu (« ${raw.country} »)`);
  }

  return {
    line,
    errors,
    warnings,
    values: {
      name,
      email,
      whatsappPhone: readPhone(raw.whatsappPhone),
      localPhone: readPhone(raw.localPhone),
      birthDate: birthDate ?? "",
      arabicReadingLevel: level ?? "debutant",
      country: country ?? "",
      city: raw.city ?? "",
      postalCode: raw.postalCode ?? "",
      addressLine: raw.addressLine ?? "",
      previousExperience: raw.previousExperience ?? "",
      notes: raw.notes ?? "",
    },
  };
}

type Level = "debutant" | "intermediaire" | "avance";

/**
 * « Débutante », « beginner », « 1 » — trois façons de dire la même chose.
 *
 * Les valeurs EXACTES sont essayées avant les préfixes. C'est ce qui
 * distingue « b » (intermédiaire) de « beginner » (débutante) : un
 * préfixe d'une seule lettre attrape tout ce qui commence par elle.
 * Ce commentaire fait foi.
 */
const LEVEL_EXACT: Record<Level, string[]> = {
  avance: ["3", "c", "avance", "avancee", "advanced", "expert", "confirme", "confirmee"],
  intermediaire: ["2", "b", "intermediaire", "intermediate", "moyen", "moyenne"],
  debutant: ["1", "a", "debutant", "debutante", "beginner", "novice", "initiation", "debut"],
};

const LEVEL_PREFIX: Record<Level, RegExp> = {
  avance: /^(avance|advanced|expert|confirme)/,
  intermediaire: /^(intermediaire|intermediate|moyen)/,
  debutant: /^(debutant|beginner|novice|initiation)/,
};

export function readLevel(value: string | undefined): Level | null {
  if (!value) return null;
  const text = normalizeHeader(value);
  if (!text) return null;

  for (const level of ["avance", "intermediaire", "debutant"] as Level[]) {
    if (LEVEL_EXACT[level].includes(text)) return level;
  }
  for (const level of ["avance", "intermediaire", "debutant"] as Level[]) {
    if (LEVEL_PREFIX[level].test(text)) return level;
  }
  return null;
}

/**
 * Une date, quel que soit le dialecte du tableur.
 *
 * `12/03/1995` est lu à la FRANÇAISE (jour d'abord). C'est le seul choix
 * défendable pour un institut francophone, et l'ambiguïté avec le format
 * américain est irréductible : aucune analyse ne distingue le 3 décembre
 * du 12 mars. Au-delà de 12, le jour est reconnu sans ambiguïté.
 */
export function readDate(value: string | undefined): string | null {
  if (!value) return null;
  const text = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return validDate(text);

  const parts = text.match(/^(\d{1,2})[\/.\- ](\d{1,2})[\/.\- ](\d{2,4})$/);
  if (parts) {
    const day = Number(parts[1]);
    const month = Number(parts[2]);
    let year = Number(parts[3]);
    // « 95 » veut dire 1995, « 12 » veut dire 2012 : une élève née
    // l'an prochain n'existe pas.
    if (year < 100) year += year > new Date().getFullYear() % 100 ? 1900 : 2000;
    return validDate(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }

  if (/^\d+([.,]\d+)?$/.test(text)) {
    return excelSerialToDate(Number(text.replace(",", ".")));
  }

  return null;
}

function validDate(iso: string): string | null {
  const parsed = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed) || parsed > Date.now()) return null;
  // `Date.parse` accepte le 31 février en le décalant : on vérifie que
  // la date rendue est bien celle qu'on lui a donnée.
  return new Date(parsed).toISOString().slice(0, 10) === iso ? iso : null;
}

/** Le pays par son code, son nom français, ou un nom approchant. */
export function readCountry(value: string | undefined): string | null {
  if (!value) return null;
  const text = normalizeHeader(value);
  if (!text) return null;

  const byCode = COUNTRIES.find((country) => country.code.toLowerCase() === text);
  if (byCode) return byCode.code;

  const byName = COUNTRIES.find(
    (country) => normalizeHeader(country.name) === text
  );
  if (byName) return byName.code;

  const approaching = COUNTRIES.find((country) => {
    const name = normalizeHeader(country.name);
    return name.startsWith(text) || text.startsWith(name);
  });
  return approaching?.code ?? null;
}

/** Espaces, points et parenthèses sautent ; le « + » reste. */
export function readPhone(value: string | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned.length >= 6 ? cleaned.slice(0, 20) : "";
}

/**
 * Une date Excel est un NOMBRE de jours depuis le 30 décembre 1899.
 *
 * Le décalage de deux jours par rapport au 1ᵉʳ janvier 1900 vient d'un
 * bug d'origine d'Excel : il croit que 1900 était bissextile. Toutes les
 * feuilles du monde comptent avec ce bug, donc on compte comme elles.
 * Rien au-dessous de 61 n'est converti : ce sont les jours où le bug
 * fausse encore le calcul, et une cellule qui vaut « 3 » est presque
 * toujours un nombre, pas le 2 janvier 1900.
 */
export function excelSerialToDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 61 || serial > 60_000) return null;
  const milliseconds = Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000;
  return new Date(milliseconds).toISOString().slice(0, 10);
}
