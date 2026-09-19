/**
 * Reprise des participations antérieures à la consommation collective.
 *
 * Les lignes sessionParticipants créées avant cette règle n'ont pas de
 * subscriptionId : elles ne débitent aucun forfait. Ce script leur attribue
 * le forfait de l'élève pour le programme de la séance — le forfait actif,
 * à défaut le plus récent.
 *
 * Usage : npx tsx src/db/backfill-participant-subscriptions.ts
 *
 * ATTENTION : ce script modifie la consommation des forfaits existants.
 * Certains forfaits peuvent dépasser leur total après reprise ; ils ne sont
 * pas refermés automatiquement, à vous de les revoir dans l'interface.
 * Faites une sauvegarde avant.
 */
import { config } from "dotenv";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { sessionParticipants, subscriptions } from "./schema";

config({ path: ".env.local" });
config();

async function backfill() {
  const orphans = await db.query.sessionParticipants.findMany({
    where: isNull(sessionParticipants.subscriptionId),
    with: { session: { with: { subscription: true } } },
  });

  console.log(`${orphans.length} participation(s) sans forfait.`);

  let linked = 0;
  let skipped = 0;

  for (const participant of orphans) {
    const programId = participant.session.subscription.programId;

    const candidates = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.studentProfileId, participant.studentProfileId),
        eq(subscriptions.programId, programId)
      ),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    const resolved =
      candidates.find((c) => c.status === "active")?.id ?? candidates[0]?.id ?? null;

    if (!resolved) {
      skipped++;
      continue;
    }

    await db
      .update(sessionParticipants)
      .set({ subscriptionId: resolved })
      .where(eq(sessionParticipants.id, participant.id));
    linked++;
  }

  console.log(`  ${linked} rattachée(s), ${skipped} sans forfait correspondant.`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Reprise échouée :", err);
  process.exit(1);
});
