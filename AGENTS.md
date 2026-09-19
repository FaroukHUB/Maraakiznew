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

## Vérification locale

PostgreSQL est requis (`docker-compose.yml`). Avant de pousser :
`npx tsc --noEmit`, `npm run lint`, `npx next build`.
Une seule erreur de lint préexiste, dans `src/app/admin/subscriptions/new/form.tsx`.
