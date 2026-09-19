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
