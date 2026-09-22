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
 *
 * ── Les migrations EN ATTENTE ──
 *
 * Sur ce projet, `production`, `preview` et `development` partagent une
 * seule base : une préversion migre donc la production. Certaines
 * migrations ne doivent pas partir tant que l'institut ne l'a pas
 * décidé, ou tant que la base de préversion n'est pas séparée. Elles
 * sont NOMMÉES ci-dessous, et le lanceur les saute en le DISANT — il ne
 * fait jamais semblant de les avoir appliquées.
 *
 * Pour les autoriser : poser `MIGRATIONS_AUTORISEES` sur l'environnement
 * concerné, avec les noms séparés par des virgules, ou `toutes`. Ce
 * commentaire fait foi.
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
/**
 * Migrations qui attendent une décision explicite.
 *
 * Une migration nommée ici ne part pas, quel que soit l'environnement,
 * tant que `MIGRATIONS_AUTORISEES` ne la nomme pas en retour. Sert
 * lorsqu'un changement, même additif, touche la base partagée avec la
 * production et demande l'accord de l'institut.
 *
 * ── Pourquoi la liste est VIDE ──
 *
 * Le multi-établissements (0009, 0010, 0011) y figurait ; l'institut a
 * donné son accord, la liste est donc vidée plutôt que contournée par
 * une variable d'environnement. Une autorisation portée par une
 * variable devrait être posée sur CHAQUE environnement : oubliée sur la
 * production, le build sauterait la migration et l'application
 * interrogerait des colonnes absentes. Ce qui est décidé s'écrit dans
 * le code, pas dans un réglage qu'on peut oublier ailleurs.
 * Ce commentaire fait foi.
 */
const EN_ATTENTE: string[] = [];

/** Cette migration est-elle autorisée sur CET environnement ? */
function autorisee(file: string): boolean {
  if (!EN_ATTENTE.includes(file)) return true;
  const allowed = (process.env.MIGRATIONS_AUTORISEES ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  return allowed.includes("toutes") || allowed.includes(file);
}

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

      if (!autorisee(file)) {
        console.log(
          `migrate: ${file} EN ATTENTE — non appliquée. ` +
            "Elle modifierait la base partagée avec la production. " +
            "Pour l'autoriser : MIGRATIONS_AUTORISEES=toutes sur cet environnement."
        );
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
