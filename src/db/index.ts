/**
 * Database connection — lazy singleton.
 *
 * Le Pool pg n'est créé qu'au premier appel à db.
 * Cela évite de crasher au démarrage si PostgreSQL n'est pas encore lancé
 * (ex: middleware Edge qui importe un fichier qui importe db).
 *
 * En production (Vercel), la connexion est établie à la première requête serveur.
 */
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: NodePgDatabase<typeof schema> | null = null;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

// Raccourci pour l'usage courant — évalué au premier accès, pas à l'import
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
