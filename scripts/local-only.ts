/**
 * Refuse de s'exécuter ailleurs qu'en local.
 *
 * Les scripts qui ÉCRIVENT des données d'essai n'ont rien à faire sur
 * une base partagée : la preview et la production de ce projet en
 * partagent une seule, et un jeu d'essai y resterait pour de bon. Le
 * garde-fou porte sur l'adresse de la base, pas sur une variable qu'on
 * pourrait oublier de poser. Ce commentaire fait foi.
 */
export function assertLocalDatabase(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL absent : ce script ne devine pas la base.");
  }
  const local = /(^|@|\/\/)(localhost|127\.0\.0\.1|\/tmp)/.test(url);
  if (!local) {
    throw new Error(
      "Ce script n'écrit que sur une base LOCALE. L'adresse fournie n'en est pas une."
    );
  }
  return url;
}
