import { inflateRawSync } from "node:zlib";

/**
 * Lire un tableur, sans dépendance.
 *
 * ── Pourquoi pas une bibliothèque ──
 *
 * Les paquets npm qui lisent le .xlsx traînent des failles connues
 * (pollution de prototype, expressions régulières explosives) et
 * évaluent des formules. On leur donnerait ici un fichier envoyé par
 * un inconnu depuis un navigateur : c'est exactement le cas où l'on ne
 * veut pas de code qu'on n'a pas lu.
 *
 * Ce module ne fait donc que trois choses, et rien d'autre : ouvrir
 * l'archive, lire deux fichiers XML, rendre des chaînes. Aucune
 * formule n'est évaluée, aucun lien externe n'est suivi.
 * Ce commentaire fait foi.
 *
 * ── Les plafonds ne sont pas décoratifs ──
 *
 * Une archive de quelques kilo-octets peut se décompresser en plusieurs
 * giga-octets. Chaque entrée est donc bornée AVANT d'être décompressée,
 * d'après la taille annoncée par l'archive, et l'ensemble aussi.
 */

/** Taille décompressée acceptée, par entrée et au total. */
const MAX_ENTRY_BYTES = 12_000_000;
const MAX_TOTAL_BYTES = 24_000_000;

/** Nombre de lignes lues au maximum — au-delà, c'est un export de base. */
export const MAX_SPREADSHEET_ROWS = 1000;

export type Sheet = {
  /** Les lignes, cellules déjà converties en texte. */
  rows: string[][];
  /** « csv » ou « xlsx » : sert à expliquer une erreur de lecture. */
  kind: "csv" | "xlsx";
};

export function parseSpreadsheet(bytes: Buffer, filename: string): Sheet {
  const looksZipped =
    bytes.length > 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  // Le contenu décide, pas l'extension : un .csv renommé en .xlsx est
  // courant, et l'inverse aussi.
  if (looksZipped) return { rows: parseXlsx(bytes), kind: "xlsx" };

  if (/\.xlsx?$/i.test(filename) && !looksZipped && bytes.length > 8 && bytes[0] === 0xd0) {
    throw new Error(
      "Ce fichier est un ancien classeur Excel (.xls). Enregistrez-le en .xlsx ou en CSV."
    );
  }

  return { rows: parseCsv(bytes.toString("utf8")), kind: "csv" };
}

// ─── CSV ─────────────────────────────────────────────────

/**
 * Le séparateur est DEVINÉ sur la première ligne.
 *
 * Un tableur français exporte avec des points-virgules, un outil anglais
 * avec des virgules, et une copie depuis une page web avec des
 * tabulations. Demander à l'utilisatrice lequel elle a serait lui poser
 * une question dont elle ignore la réponse.
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const separator = guessSeparator(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];

    if (quoted) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (rows.length >= MAX_SPREADSHEET_ROWS) return rows;
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((line) => line.some((value) => value.trim() !== ""));
}

function guessSeparator(line: string): string {
  const counts = [";", ",", "\t"].map((sep) => ({
    sep,
    count: line.split(sep).length - 1,
  }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].sep : ";";
}

// ─── XLSX ────────────────────────────────────────────────

function parseXlsx(bytes: Buffer): string[][] {
  const entries = readZipEntries(bytes);

  const sharedRaw = entries.get("xl/sharedStrings.xml");
  const shared = sharedRaw ? readSharedStrings(sharedRaw.toString("utf8")) : [];

  // La première feuille suffit : un import se fait sur une feuille, et
  // deviner laquelle parmi cinq ferait plus de dégâts que de service.
  const sheetName = [...entries.keys()]
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort()[0];

  if (!sheetName) {
    throw new Error("Ce classeur ne contient aucune feuille lisible.");
  }

  return readSheet(entries.get(sheetName)!.toString("utf8"), shared);
}

/** Les entrées de l'archive, décompressées, par nom. */
function readZipEntries(bytes: Buffer): Map<string, Buffer> {
  const eocd = findEndOfCentralDirectory(bytes);
  const entryCount = bytes.readUInt16LE(eocd + 10);
  let pointer = bytes.readUInt32LE(eocd + 16);

  const entries = new Map<string, Buffer>();
  let total = 0;

  for (let i = 0; i < entryCount; i += 1) {
    if (pointer + 46 > bytes.length || bytes.readUInt32LE(pointer) !== 0x02014b50) {
      throw new Error("Archive illisible : le sommaire est incomplet.");
    }

    const method = bytes.readUInt16LE(pointer + 10);
    const compressedSize = bytes.readUInt32LE(pointer + 20);
    const uncompressedSize = bytes.readUInt32LE(pointer + 24);
    const nameLength = bytes.readUInt16LE(pointer + 28);
    const extraLength = bytes.readUInt16LE(pointer + 30);
    const commentLength = bytes.readUInt16LE(pointer + 32);
    const localOffset = bytes.readUInt32LE(pointer + 42);
    const name = bytes.toString("utf8", pointer + 46, pointer + 46 + nameLength);

    pointer += 46 + nameLength + extraLength + commentLength;

    // On ne lit que les deux fichiers qui nous intéressent : le reste de
    // l'archive (styles, images, thèmes) n'a rien à faire ici.
    const wanted =
      name === "xl/sharedStrings.xml" ||
      /^xl\/worksheets\/sheet\d+\.xml$/.test(name);
    if (!wanted) continue;

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("Archive au format ZIP64 : enregistrez le fichier en CSV.");
    }
    if (uncompressedSize > MAX_ENTRY_BYTES) {
      throw new Error("Ce classeur contient une feuille trop volumineuse.");
    }
    total += uncompressedSize;
    if (total > MAX_TOTAL_BYTES) {
      throw new Error("Ce classeur est trop volumineux.");
    }

    entries.set(name, readEntry(bytes, localOffset, method, compressedSize));
  }

  return entries;
}

function readEntry(
  bytes: Buffer,
  localOffset: number,
  method: number,
  compressedSize: number
): Buffer {
  if (bytes.readUInt32LE(localOffset) !== 0x04034b50) {
    throw new Error("Archive illisible : une entrée est corrompue.");
  }
  const nameLength = bytes.readUInt16LE(localOffset + 26);
  const extraLength = bytes.readUInt16LE(localOffset + 28);
  const start = localOffset + 30 + nameLength + extraLength;
  const slice = bytes.subarray(start, start + compressedSize);

  if (method === 0) return Buffer.from(slice);
  if (method === 8) return inflateRawSync(slice, { maxOutputLength: MAX_ENTRY_BYTES });
  throw new Error("Archive compressée d'une façon que l'application ne lit pas.");
}

function findEndOfCentralDirectory(bytes: Buffer): number {
  const lowest = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= lowest; i -= 1) {
    if (bytes.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("Ce fichier n'est pas un classeur .xlsx valide.");
}

/** Les chaînes partagées : un `<si>` peut contenir plusieurs `<t>`. */
function readSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const items = xml.match(/<si\b[\s\S]*?<\/si>|<si\s*\/>/g) ?? [];
  for (const item of items) {
    const parts = item.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) ?? [];
    out.push(
      parts
        .map((part) => decodeXml(part.replace(/<t\b[^>]*>|<\/t>/g, "")))
        .join("")
    );
  }
  return out;
}

function readSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  const rowMatches = xml.match(/<row\b[\s\S]*?<\/row>|<row\b[^>]*\/>/g) ?? [];

  for (const rowXml of rowMatches) {
    if (rows.length >= MAX_SPREADSHEET_ROWS) break;

    const cells: string[] = [];
    const cellMatches = rowXml.match(/<c\b[\s\S]*?<\/c>|<c\b[^>]*\/>/g) ?? [];

    for (const cellXml of cellMatches) {
      const reference = cellXml.match(/\br="([A-Z]+)\d+"/);
      const index = reference ? columnIndex(reference[1]) : cells.length;
      const type = cellXml.match(/\bt="([^"]+)"/)?.[1] ?? "n";

      let value = "";
      if (type === "inlineStr") {
        const parts = cellXml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) ?? [];
        value = parts
          .map((part) => decodeXml(part.replace(/<t\b[^>]*>|<\/t>/g, "")))
          .join("");
      } else {
        const raw = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
        if (raw !== undefined) {
          const text = decodeXml(raw);
          value = type === "s" ? shared[Number(text)] ?? "" : text;
        }
      }

      while (cells.length < index) cells.push("");
      cells[index] = value;
    }

    if (cells.some((cell) => cell.trim() !== "")) rows.push(cells);
  }

  return rows;
}

/** « AB » → 27. Les colonnes d'un tableur comptent en base 26. */
function columnIndex(letters: string): number {
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }
  return index - 1;
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}
