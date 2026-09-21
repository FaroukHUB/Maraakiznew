import { headers } from "next/headers";

/**
 * L'adresse publique du site, telle que la voit un visiteur.
 *
 * ── Pourquoi la reconstruire depuis les en-têtes ──
 *
 * Derrière un proxy — sur Vercel comme derrière `next start` —
 * `request.url` porte l'origine INTERNE du serveur (localhost:3000).
 * Un lien d'inscription construit à partir d'elle serait inutilisable
 * dès qu'on l'envoie. C'est la même règle que dans le middleware.
 * Ce commentaire fait foi.
 */
export async function publicOrigin(): Promise<string> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "";
  const proto = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}
