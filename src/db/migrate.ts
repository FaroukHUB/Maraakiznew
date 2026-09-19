/**
 * Lanceur de migrations — exécuté au build, sur Vercel comme en local.
 *
 * Il applique dans l'ordre les fichiers `drizzle/*.sql` qui n'ont pas
 * encore été appliqués, et garde trace des fichiers appliqués dans la
 * table `_migrations`.
 *
 * Deux garde-fous, dans cet ordre :
 *
 * 1. Aucun fichier contenant une instruction destructive n'est exécuté.
 *    Ce dépôt ne pratique que des migrations additives : on crée ce qui
 *    manque, on ne retire jamais. Une suppression de table ou de colonne
 *    se fait à la main, après sauvegarde, jamais depuis un build.
 *    Ce commentaire fait foi.
 *
 * 2. Chaque fichier s'exécute dans UNE transaction : s'il échoue au
 *    milieu, rien n'est appliqué et le build s'arrête.
 *
 * Sans DATABASE_URL, le lanceur ne fait rien et n'échoue pas : cela
 * permet un build hors ligne.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle");

/**
 * Instructions refusées. On cherche le mot-clé en DÉBUT d'instruction :
 * `ON DELETE CASCADE` à l'intérieur d'une clé étrangère est une règle
 * de référence, pas une suppression, et reste autorisé.
 */
const FORBIDDEN = [
  /(^|;)\s*DROP\s+/i,
  /(^|;)\s*TRUNCATE\s+/i,
  /(^|;)\s*DELETE\s+FROM\s+/i,
  /ALTER\s+TABLE[^;]*\bDROP\s+(COLUMN|CONSTRAINT|DEFAULT|NOT\s+NULL)/i,
  /ALTER\s+TABLE[^;]*\bALTER\s+COLUMN[^;]*\b(TYPE|SET\s+NOT\s+NULL)\b/i,
];

function assertAdditive(name: string, sql: string) {
  // On retire les commentaires avant l'analyse : une ligne « -- pas de DROP »
  // ne doit pas faire échouer la vérification.
  const stripped = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  for (const pattern of FORBIDDEN) {
    const match = stripped.match(pattern);
    if (match) {
      throw new Error(
        `Migration refusée — ${name} contient une instruction destructive : ` +
          `« ${match[0].trim()} ». Les migrations de ce dépôt sont additives.`
      );
    }
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("migrate: DATABASE_URL absent, aucune migration appliquée.");
    return;
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("migrate: aucun fichier de migration.");
    return;
  }

  // Vérification AVANT toute connexion : un fichier destructif arrête
  // tout, sans même ouvrir la base.
  for (const file of files) {
    assertAdditive(file, readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }

  // Aucune option TLS ici : le mode est porté par la chaîne de connexion
  // (`sslmode=...`), exactement comme pour l'application. Forcer
  // `rejectUnauthorized: false` reviendrait à accepter n'importe quel
  // certificat pendant le build.
  const pool = new Pool({ connectionString: url });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await pool.query<{ name: string }>(
      "SELECT name FROM _migrations"
    );
    const applied = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`migrate: ${file} déjà appliquée.`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`migrate: ${file} appliquée.`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("migrate:", error instanceof Error ? error.message : error);
  process.exit(1);
});
