"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, studentProfiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { parseSpreadsheet, MAX_SPREADSHEET_ROWS } from "@/lib/spreadsheet";
import {
  guessMapping,
  readRow,
  readCountry,
  readLevel,
  readDate,
  readPhone,
  type ImportField,
  type ImportRow,
  type ImportedStudent,
} from "@/lib/student-import";
import { countryByCode, timezoneForCountry } from "@/lib/countries";
import { getInstituteTimezone } from "@/data/settings";

/** 2 Mo : un fichier d'élèves est une liste, pas un album photo. */
const MAX_FILE_BYTES = 2_000_000;

export type ImportPreview =
  | {
      success: true;
      kind: "csv" | "xlsx";
      headers: string[];
      mapping: (ImportField | null)[];
      rows: ImportRow[];
      /**
       * Les cellules brutes, rendues telles quelles.
       *
       * L'écran doit pouvoir RECALCULER les lignes quand on corrige une
       * correspondance de colonne, sans relire le fichier. `readRow` est
       * une fonction pure, utilisable des deux côtés : c'est elle qui
       * tourne alors dans le navigateur, et de nouveau ici à l'import.
       */
      body: string[][];
      /**
       * Les adresses du fichier qui existent DÉJÀ dans l'institut.
       *
       * Les montrer à l'aperçu évite la mauvaise surprise : sans cela,
       * on lance un import de cent lignes pour apprendre après coup que
       * quarante étaient déjà là. Ce commentaire fait foi.
       */
      existingEmails: string[];
    }
  | { success: false; error: string };

/**
 * Lire le fichier et PROPOSER une lecture.
 *
 * ── Rien n'est écrit à cette étape ──
 *
 * L'écran montre les colonnes reconnues, les lignes prêtes et celles
 * qui coincent ; l'import ne part qu'au second geste. Un import qui
 * s'exécute au dépôt du fichier ne laisse aucune place à l'erreur de
 * fichier — et l'erreur de fichier est la plus fréquente de toutes.
 * Ce commentaire fait foi.
 */
export async function previewStudentImport(
  fileName: string,
  base64: string
): Promise<ImportPreview> {
  try {
    await requireAdmin();

    const bytes = Buffer.from(base64, "base64");
    if (bytes.byteLength === 0) return { success: false, error: "Fichier vide." };
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return {
        success: false,
        error: `Fichier trop lourd (${Math.round(bytes.byteLength / 1000)} Ko pour ${MAX_FILE_BYTES / 1000} Ko au maximum).`,
      };
    }

    const sheet = parseSpreadsheet(bytes, fileName);
    if (sheet.rows.length < 2) {
      return {
        success: false,
        error:
          "Ce fichier ne contient pas de données : il faut une ligne d'en-têtes, puis une ligne par élève.",
      };
    }

    const [headers, ...body] = sheet.rows;
    const mapping = guessMapping(headers);

    if (!mapping.includes("name") && !mapping.includes("firstName")) {
      return {
        success: false,
        error:
          "Aucune colonne de nom n'a été reconnue. Nommez-la « Nom » ou « Nom complet », puis réessayez.",
      };
    }

    const rows = body.map((cells, index) => readRow(cells, mapping, index + 2));

    const emails = [
      ...new Set(
        rows.map((row) => row.values.email).filter((email) => email.length > 0)
      ),
    ];
    const known =
      emails.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.email, emails),
            columns: { email: true },
          })
        : [];

    return {
      success: true,
      kind: sheet.kind,
      headers,
      mapping,
      rows,
      body,
      existingEmails: known.map((row) => row.email.toLowerCase()),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message
          ? error.message
          : "Ce fichier n'a pas pu être lu.",
    };
  }
}

export type ImportOutcome =
  | {
      success: true;
      created: number;
      /** Lignes écartées, avec la raison. */
      skipped: { line: number; email: string; reason: string }[];
    }
  | { success: false; error: string };

/**
 * Créer les élèves.
 *
 * ── Ce qui est revérifié ici ──
 *
 * TOUT. Les lignes arrivent du navigateur, donc d'un endroit qu'on ne
 * contrôle pas : nom, email, niveau, pays et date sont repassés par les
 * mêmes fonctions que l'aperçu. Un aperçu n'est pas une autorisation.
 *
 * ── Un seul mot de passe, haché une seule fois ──
 *
 * Hacher deux cents mots de passe prendrait une demi-minute pendant
 * laquelle la page semblerait figée. Toutes les élèves importées
 * partagent donc le même mot de passe initial, que l'institut leur
 * communique et qu'elles changent ensuite. Ce commentaire fait foi.
 */
function deducedZone(country: string | null, instituteZone: string): string | null {
  const zone = country ? timezoneForCountry(country) : null;
  return zone && zone !== instituteZone ? zone : null;
}

export async function runStudentImport(
  rows: { line: number; values: ImportedStudent }[],
  password: string
): Promise<ImportOutcome> {
  try {
    await requireAdmin();

    if (rows.length === 0) return { success: false, error: "Rien à importer." };
    if (rows.length > MAX_SPREADSHEET_ROWS) {
      return { success: false, error: "Trop de lignes pour un seul import." };
    }

    const initial = password.trim() || "maraakiz";
    if (initial.length < 6) {
      return {
        success: false,
        error: "Le mot de passe initial doit faire au moins 6 caractères.",
      };
    }

    const skipped: { line: number; email: string; reason: string }[] = [];
    const candidates: { line: number; values: ImportedStudent }[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      const name = row.values.name?.trim() ?? "";
      const email = row.values.email?.trim().toLowerCase() ?? "";

      if (name.length < 2) {
        skipped.push({ line: row.line, email, reason: "nom manquant" });
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        skipped.push({ line: row.line, email, reason: "email invalide" });
        continue;
      }
      // Un même email deux fois dans le fichier : la seconde ligne est
      // écartée, sinon la création échouerait au milieu de l'import.
      if (seen.has(email)) {
        skipped.push({ line: row.line, email, reason: "en double dans le fichier" });
        continue;
      }
      seen.add(email);
      candidates.push({ line: row.line, values: { ...row.values, name, email } });
    }

    if (candidates.length === 0) {
      return { success: true, created: 0, skipped };
    }

    const existing = await db.query.users.findMany({
      where: inArray(
        users.email,
        candidates.map((row) => row.values.email)
      ),
      columns: { email: true },
    });
    const taken = new Set(existing.map((row) => row.email.toLowerCase()));

    const { hash } = await import("bcryptjs");
    const passwordHash = await hash(initial, 10);
    const instituteZone = await getInstituteTimezone();

    let created = 0;
    for (const row of candidates) {
      if (taken.has(row.values.email)) {
        skipped.push({
          line: row.line,
          email: row.values.email,
          reason: "déjà inscrite",
        });
        continue;
      }

      const country = readCountry(row.values.country);
      const birthDate = readDate(row.values.birthDate);

      // Une élève par transaction : une ligne fautive n'annule pas les
      // cent qui l'ont précédée.
      await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            email: row.values.email,
            passwordHash,
            name: row.values.name,
            role: "student",
          })
          .returning();

        await tx.insert(studentProfiles).values({
          userId: user.id,
          whatsappPhone: readPhone(row.values.whatsappPhone) || null,
          localPhone: readPhone(row.values.localPhone) || null,
          arabicReadingLevel: readLevel(row.values.arabicReadingLevel) ?? "debutant",
          birthDate,
          addressLine: row.values.addressLine?.trim().slice(0, 255) || null,
          postalCode: row.values.postalCode?.trim().slice(0, 20) || null,
          city: row.values.city?.trim().slice(0, 120) || null,
          country: country && countryByCode(country) ? country : null,
          // Le fuseau se déduit du pays, comme à la saisie manuelle. Il
          // reste NULL quand le pays en compte plusieurs, ET quand il
          // vaut celui de l'institut : « NULL veut dire comme l'institut »
          // (voir `schema/student-profiles.ts`).
          timezone: deducedZone(country, instituteZone),
          previousExperience: row.values.previousExperience?.trim() || null,
          notes: row.values.notes?.trim() || null,
        });
      });

      taken.add(row.values.email);
      created += 1;
    }

    revalidatePath("/admin/students", "layout");
    revalidatePath("/admin/dashboard");
    return { success: true, created, skipped };
  } catch {
    return { success: false, error: "L'import s'est interrompu." };
  }
}
