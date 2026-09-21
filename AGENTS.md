<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Maraakiz — état du projet

## Règles de calcul, écrites dans le schéma

Les règles métier vivent dans `src/db/schema/`, chacune avec un commentaire
qui dit « Ce commentaire fait foi ». Toute query doit passer par les
constantes et les fonctions de calcul associées, jamais recalculer à la
main — la duplication a déjà été supprimée une fois, elle ne doit pas
revenir.

| Règle | Où | Point d'entrée unique |
|---|---|---|
| Consommation d'un forfait | `sessions.ts` | `getConsumedSessionCount(s)` — `data/sessions.ts` |
| Taux d'assiduité | `sessions.ts` | `getAttendanceStats` — `data/attendance.ts` |
| Progression pédagogique | `skills.ts` | `getStudentProgress` — `data/skills.ts` |
| Répétition espacée | `memorization.ts` | `getDueReviews` — `data/memorization.ts` |
| Bulletin figé à la génération | `report-cards.ts` | `createReportCard` / `refreshReportCard` — `actions/report-cards.ts` |
| Numérotation des factures | `invoices.ts` | `issueInvoice` — `actions/invoices.ts` |
| Note d'une évaluation | `assessments.ts` | `scorePercentage` — `db/schema/assessments.ts` |
| Mention d'un diplôme | `certificates.ts` | `mentionForScore` — `db/schema/certificates.ts` |
| Conversion d'un prospect | `prospects.ts` | `convertProspect` — `actions/prospects.ts` |
| Rémunération et paie | `staff.ts` | `computePayroll` — `data/staff.ts` |
| Stock de la boutique | `shop.ts` | `createOrder` / `setOrderStatus` — `actions/shop.ts` |
| Récompense de parrainage | `referrals.ts` | `markReferralEarned` — `actions/referrals.ts` |
| Progression d'un cours | `courses.ts` | `getCoursesForStudent` — `data/courses.ts` |
| Réglages de l'institut | `settings.ts` | `getSettings` / `whatsappLink` — `data/settings.ts` |
| Étoiles d'une élève | `student-followup.ts` | `starBalance` — `db/schema/student-followup.ts` |
| Âge d'une élève | — | `ageFromBirthDate` — `data/students.ts` |

## Navigation

`src/lib/navigation.ts` est la **source unique** : barre latérale
administration, barre latérale élève et menu mobile en partent tous, via
`components/layout/nav-tree.tsx`. Les listes ont vécu en triple, et ont
divergé ; ne pas les recopier.

La règle de rangement est dans le fichier. En résumé : une entrée va dans
la section de la question qu'on se pose en la cherchant, pas dans celle de
la table qu'elle affiche ; une section compte entre deux et six entrées.
La section de la page ouverte est toujours dépliée — l'entrée surlignée ne
doit jamais être cachée.

Ajouter un écran, c'est ajouter son entrée ici. Le contrôle est
mécanique : toute page de premier niveau sous `src/app/admin` ou
`src/app/student` doit avoir un `href` correspondant.

## Interface : le tableau de bord et les effets

`src/app/globals.css` porte les utilitaires d'effet (`aurora`, `grain`,
`rise`, `glass`, `tile`, `ring-value`, `bar-fill`, `tick`). Trois règles,
écrites dans le fichier :

1. **Aucune animation n'est nécessaire à la lecture.** Chaque effet part
   d'un état déjà correct, ou se joue en `backwards` depuis l'état final.
   Un chiffre animé en JavaScript affiche zéro tant qu'il n'a pas démarré —
   c'est un chiffre faux. Les tuiles sont donc rendues par le serveur, en
   texte, et seules les animations sont en CSS.
2. **`prefers-reduced-motion` coupe tout**, d'un seul bloc en fin de
   fichier.
3. **Les couleurs viennent des jetons du thème**, jamais d'une valeur
   écrite en dur.

Le salam est dans `src/lib/greeting.ts` : le salam lui-même ne change
jamais, seul le vœu suit l'heure (et l'ambiance du bandeau avec lui). Les
bornes sont un tableau, à modifier si l'institut veut les caler sur les
horaires de prière.

Tout ce qui dépend de l'heure passe par `src/lib/use-now.ts` : le serveur
rend `null`, le navigateur la vraie valeur. Le serveur ne connaît pas le
fuseau de la personne, et une heure fausse est pire que pas d'heure.

L'horloge est un `<time dateTime="HH:MM">` avec `aria-label` : son contenu
est découpé pour faire clignoter le deux-points, et se lirait sinon
« 11 : 23 ».

## Fuseaux horaires

**Aucun affichage de date ou d'heure ne se fait sans fuseau explicite.**
Sans `timeZone`, `Intl` prend celui du PROCESSUS — UTC sur Vercel — et
une séance de 18 h à Paris s'affiche 16 h, pour tout le monde, sans que
rien n'ait l'air cassé. C'est le bug qui existait avant : les 38 appels
directs à `Intl.DateTimeFormat` ont tous été remplacés.

- `src/lib/timezones.ts` : la liste des fuseaux, les décalages, le
  changement de quantième, les heures calmes (`QUIET_HOURS`).
- `src/lib/datetime.ts` : le formatage. **Toutes ses fonctions exigent un
  fuseau** — c'est ce qui empêche la faute de revenir. Aucun
  `new Intl.DateTimeFormat` ne doit réapparaître ailleurs pour une date
  métier.
- `instantFromLocalInput` : une saisie `datetime-local` se lit dans le
  fuseau de l'INSTITUT, pas celui du navigateur. Le comportement aux deux
  heures qui n'existent pas normalement (changement d'heure) est décrit
  dans le fichier et couvert par les tests.

Qui voit quoi : côté administration, le fuseau de l'institut
(`getInstituteTimezone`) — c'est sur lui que le planning est calé, même
si l'enseignante est en déplacement. Côté élève, le sien
(`getTimezoneForStudent`). Un en-tête partagé passe par
`getViewerTimezone`.

Le fuseau d'une élève est NULL par défaut : cela veut dire « celui de
l'institut ». On ne pose une valeur que lorsqu'elle DIFFÈRE.

**Le fuseau se saisit par le PAYS** (`src/lib/countries.ts`) : personne ne
sait par cœur qu'on écrit « Africa/Casablanca », tout le monde sait dans
quel pays vit son élève. Un pays à plusieurs fuseaux — Canada,
États-Unis, Russie, Australie, Brésil, Indonésie, Mexique — porte
`timezone: null` : deviner y serait faux une fois sur deux, le champ
reste à remplir à la main et l'interface le dit.

## Personnalisation

Deux choses se personnalisent, et elles ne vivent pas au même endroit :

- **Les couleurs sont celles de l'INSTITUT** (`settings`) : c'est son
  identité, et les élèves les voient aussi. Deux couleurs suffisent, toute
  la palette en dérive (`src/lib/theme.ts`).
- **Le tableau de bord est PERSONNEL** (`user_preferences`) : c'est un plan
  de travail. Deux enseignantes du même institut ne suivent pas les mêmes
  choses.

**Ce qui ne se retire jamais : le salam, la date et l'heure.** Ils ne
figurent pas dans `src/lib/dashboard-blocks.ts` et n'ont pas
d'interrupteur.

**Ce qui ne se personnalise jamais : les couleurs de statut.** Vert « c'est
bon », ambre « attention », rouge « il y a un problème ». `deriveTheme`
ne produit aucun de ces jetons.

**Le garde-fou de contraste.** Toute couleur choisie est assombrie jusqu'à
atteindre les seuils WCAG (7:1 pour le texte courant, 4,5:1 pour le reste)
sans changer de teinte — c'est pour cela que le thème est en oklch. Les
corrections appliquées sont RENDUES dans l'interface : corriger en douce
laisserait croire que le choix n'a pas été pris en compte.

**Le halo du bandeau ne peut utiliser que des jetons du THÈME.** Il a
un temps utilisé `--quran`, une couleur de parcours fixe : le bandeau
restait turquoise tous les soirs quelle que soit la palette. Le moment de
la journée fait varier le mélange, jamais la teinte de base. Un test
compare la liste des `var(--…)` employés aux jetons que `deriveTheme`
produit réellement.

**L'image du bandeau** vit dans `institute_assets`, en base, et est servie
par `/api/institute/[key]` avec une empreinte — jamais inscrite dans le
HTML. Ce choix ne tient que parce que le volume reste minuscule : l'image
est réduite à 1600 px dans le navigateur et plafonnée à 1,5 Mo. Le type
déclaré n'est pas cru : les premiers octets sont relus.

Le voile posé par-dessus garantit la lisibilité du salam quelle que soit
la photo, et ce n'est pas un réglage à l'œil : un test décode la capture
d'écran, échantillonne le fond réellement composé sous le texte et mesure
le contraste (5,88 sur une photo noire, pour un seuil de 4,5). Il vérifie
aussi que la photo est VISIBLE — sans cela, la mesure passerait sur un
bandeau vide.

Ajouter un bloc au tableau de bord : une entrée dans
`DASHBOARD_BLOCKS`, et son rendu dans la page. Les préférences déjà
enregistrées ne le citent pas, donc il apparaît — une nouveauté se voit,
elle ne se cache pas. Une clé disparue est ignorée à la lecture.

## Modifier se fait en MODALE, consulter se fait en PAGE

C'est la règle d'interface, demandée par l'institut et appliquée onglet
par onglet (`src/components/ui/dialog.tsx`).

- **Modifier** quelque chose qu'on a sous les yeux → modale. On ne quitte
  pas la page, on ne perd pas sa place.
- **Consulter** → page, avec une adresse qu'on peut envoyer et rouvrir.

Une modale ne contient donc jamais une liste ni une navigation interne.
Si le contenu n'y tient pas, c'était une page.

Le déclencheur se passe en `render`, **jamais en enfant** : en enfant,
base-ui produit un `<button>` dans un `<button>`, HTML invalide, et
l'hydratation échoue avec une erreur React minifiée difficile à lire.

Les onglets internes d'une fiche sont des **liens** (`?onglet=paie`,
`src/components/ui/tab-links.tsx`), pas un état de composant : chacun a
son adresse, et on ne charge que le contenu regardé. Un onglet inconnu
retombe sur le premier sans erreur.

## L'onglet Élèves

La fiche suit la même forme que celle des professeurs : un en-tête
toujours visible (identité, contact, groupes, actions) puis des onglets
en liens — `général`, `séances`, `coran`, `progression`, `forfaits`,
`évaluations`, `documents`.

**Les étoiles.** On n'enregistre jamais un total : `student_rewards` est
une pile d'événements datés, et le total se recalcule par `starBalance`.
Le « + » empile, le « − » EFFACE le dernier événement du motif — c'est
une correction, pas une sanction. Les pénalités sont des motifs à part
qui valent −1, et un total négatif reste négatif.

**Les notes privées.** `student_notes` est datée et empilée ; le champ
`student_profiles.notes` reste la remarque permanente. Aucune page de
`/student` ne doit lire les notes privées.

**Les rappels de révision** ne se saisissent pas : ils sortent du cycle
de mémorisation (`memorization_items.next_review_at`).

**Suspendre n'est pas supprimer.** Une élève suspendue garde tout et
revient d'un clic. `deleteStudent` REFUSE dès qu'un forfait ou un
paiement existe : la cascade emporterait des lignes comptables.

**Le mode d'affichage** (liste / cartes) tient dans un cookie lu par le
serveur — `src/lib/view-cookies.ts`. Ce nom ne peut pas vivre dans un
module `"use client"` : le serveur n'en recevrait qu'une référence, et le
cookie ne serait jamais retrouvé. C'est le piège qui a fait échouer la
première version.

**Pas encore construits, faute de décision** : le lien d'inscription
public (aucun parcours d'auto-inscription n'existe), l'import IA
Excel/CSV, l'onglet Photos (les documents sont des LIENS, l'application
n'héberge pas de fichiers d'élèves) et les concours.

## Décisions en attente de l'institut

1. **Les absences excusées consomment-elles une séance du forfait ?**
   Aujourd'hui non, par symétrie avec `teacher_absent` : ce qui est annoncé
   à l'avance ne fait pas perdre la séance. Pour changer, ajouter `"excused"`
   à `CONSUMING_ATTENDANCE_STATUSES` dans `src/db/schema/sessions.ts` — et
   rien d'autre.

2. **Une séance de groupe et les forfaits individuels.** Le groupe est une
   couche d'organisation ; chaque élève garde son forfait. Voir
   `src/db/schema/groups.ts`.

3. **Le référentiel de compétences et les portions du seed sont des jeux de
   départ rédigés pour la démonstration**, pas le programme réel de
   l'institut. À remplacer depuis `/admin/skills`.

4. **`src/lib/quran.ts`** : les translittérations des 114 sourates sont à
   relire selon les conventions de l'institut. Le total des versets (6236)
   est conforme au décompte canonique.

5. **Reprise des données** : `src/db/backfill-participant-subscriptions.ts`
   rattache les participations antérieures à la consommation collective.
   À lancer après sauvegarde — il peut faire dépasser des forfaits.

## Déploiement et base de données

`vercel-build` applique les migrations **avant** de construire. Deux règles,
tenues par `src/db/migrate.ts` :

1. **Les migrations sont additives.** Le lanceur refuse tout fichier
   contenant `DROP`, `TRUNCATE`, `DELETE FROM`, un `DROP COLUMN` /
   `CONSTRAINT` / `DEFAULT`, ou un changement de type de colonne — avant
   même d'ouvrir la connexion. Une suppression se fait à la main, après
   sauvegarde, jamais depuis un build. Ce commentaire fait foi.
2. **Un fichier, une transaction.** S'il échoue au milieu, rien n'est
   appliqué et le build s'arrête.

Pour ajouter une migration : écrire `drizzle/NNNN_nom.sql` en
`CREATE ... IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, et poser chaque
contrainte sous `IF NOT EXISTS (SELECT 1 FROM pg_constraint ...)`. Une clé
primaire se teste par `contype = 'p'` sur la table, pas par son nom : la
reposer sous un autre nom échoue. Vérifier ensuite l'idempotence en
appliquant le fichier trois fois de suite sur une base vide.

**Sur ce projet Vercel, les environnements `production`, `preview` et
`development` partagent le même `DATABASE_URL`.** Un déploiement de
préversion migre donc la base de production. C'est la raison pour laquelle
les migrations sont additives.

`npm run db:seed` **efface tout** avant de repeupler. Il ne doit jamais
être lancé sur la base partagée sans décision explicite de l'institut.

## Vérification locale

PostgreSQL est requis (`docker-compose.yml`). Avant de pousser :
`npx tsc --noEmit`, `npm run lint`, `npx next build`.
Une seule erreur de lint préexiste, dans `src/app/admin/subscriptions/new/form.tsx`.

La recette au navigateur passe par les 47 pages d'administration et les 15
pages élève, et vérifie dans les deux sens que l'espace administration est
fermé aux élèves et l'espace élève aux visiteuses non connectées.
