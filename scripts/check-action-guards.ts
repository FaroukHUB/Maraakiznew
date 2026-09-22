/**
 * Vérifie que chaque action serveur déclare qui peut l'appeler.
 *
 * ── Pourquoi un script plutôt qu'une relecture ──
 *
 * Une action serveur n'est pas une adresse : le middleware ne la protège
 * pas. Il suffit d'oublier une ligne dans une action nouvelle pour
 * rouvrir le trou — et cet oubli ne se voit ni à l'écran, ni au type, ni
 * au test fonctionnel, puisque l'administration, elle, a bien les droits.
 *
 * Ce script lit `src/actions/*.ts` et exige que chaque fonction exportée
 * appelle une garde. Les seules exceptions sont déclarées ici, nommément,
 * avec la raison. Ce commentaire fait foi.
 *
 * Usage : npx tsx scripts/check-action-guards.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "src/actions");

const GUARDS = [
  "assertAdmin",
  "assertSelfOrAdmin",
  "assertOwnProfileOrAdmin",
  "requireAdmin",
  "requireAuth",
];

/** Actions volontairement ouvertes, et pourquoi. */
const PUBLIC: Record<string, string> = {
  "registration.submitPublicRegistration":
    "formulaire public : protégé par le jeton du lien, un champ piège et le garde-fou de doublon",
  "registration.checkRegistrationToken":
    "lecture seule : dit si un jeton est valable, n'écrit rien",
  "registration.resolveRegistrationInstitute":
    "lecture seule : dit à quel établissement mène un jeton, n'écrit rien ; c'est elle qui protège le formulaire public",
};

let failures = 0;
let checked = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".ts")).sort()) {
  const source = readFileSync(join(DIR, file), "utf8");
  const area = file.replace(/\.ts$/, "");

  const matches = [...source.matchAll(/export async function (\w+)\s*\(/g)];

  for (let i = 0; i < matches.length; i += 1) {
    const name = matches[i][1];
    const start = matches[i].index ?? 0;
    const end = matches[i + 1]?.index ?? source.length;
    const body = source.slice(start, end);
    const key = `${area}.${name}`;
    checked += 1;

    if (PUBLIC[key]) continue;

    if (!GUARDS.some((guard) => body.includes(`${guard}(`))) {
      console.error(`✗ ${key} — aucune garde d'autorisation`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} action(s) sans garde sur ${checked}. ` +
      "Ajoutez `await assertAdmin();` dans le `try`, ou déclarez l'exception dans ce script."
  );
  process.exit(1);
}

console.log(`✓ ${checked} actions serveur, toutes gardées.`);
