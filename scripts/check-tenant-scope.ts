/**
 * Vérifie que chaque requête de la couche de données est cloisonnée.
 *
 * ── Pourquoi un script plutôt qu'une relecture ──
 *
 * Une requête qui oublie l'établissement ne se voit NULLE PART : elle
 * compile, elle s'affiche, elle passe les essais — tant qu'il n'y a qu'un
 * seul institut dans la base. Le jour où il y en a deux, elle montre les
 * élèves de l'un à l'autre, sans rien signaler.
 *
 * Ce script lit `src/data/*.ts` et exige que tout fichier qui interroge
 * la base appelle `requireInstitute`. Les exceptions sont déclarées ici,
 * nommément, avec leur raison. Ce commentaire fait foi.
 *
 * Il ne remplace pas la relecture : il attrape l'oubli franc, pas la
 * requête cloisonnée sur la mauvaise colonne. C'est ce que vérifie, lui,
 * l'essai à deux établissements.
 *
 * Usage : npx tsx scripts/check-tenant-scope.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "src/data");

/** Fichiers volontairement hors du cloisonnement par session, et pourquoi. */
const EXEMPT: Record<string, string> = {
  "settings.ts":
    "réglages d'affichage : lus par la disposition racine et la page publique d'inscription, qui n'ont pas de session ; l'établissement y est résolu explicitement",
  "assets.ts":
    "image du bandeau : même raison, et l'établissement est porté par l'adresse servie",
  "preferences.ts":
    "préférences d'une PERSONNE (disposition du tableau de bord), attachées au compte et non à un établissement",
};

let failures = 0;
let checked = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".ts")).sort()) {
  const source = readFileSync(join(DIR, file), "utf8");
  checked += 1;

  const queries = /\bdb\s*\.\s*(query|select|selectDistinct|insert|update|delete)\b/.test(
    source
  );
  if (!queries) continue;

  if (EXEMPT[file]) {
    // Une exemption doit rester exacte : si le fichier s'est mis à
    // cloisonner, c'est l'exemption qu'il faut retirer.
    continue;
  }

  if (!/requireInstitute\s*\(/.test(source)) {
    console.error(
      `✗ src/data/${file} — interroge la base sans appeler requireInstitute()`
    );
    failures += 1;
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} fichier(s) de données non cloisonné(s) sur ${checked}. ` +
      "Ajoutez `const institute = await requireInstitute();` puis filtrez sur " +
      "`instituteId`, ou déclarez l'exception dans ce script."
  );
  process.exit(1);
}

console.log(`✓ ${checked} fichiers de données, tous cloisonnés.`);
