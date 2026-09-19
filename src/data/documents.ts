import { asc, desc, eq, isNotNull, and, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

// Réexport pour les composants serveur ; les composants client importent
// depuis @/lib/constants (voir le commentaire dans data/assessments.ts).
export { DOCUMENT_TYPE_LABELS } from "@/lib/constants";

export async function getDocumentsForAdmin() {
  return db.query.documents.findMany({
    orderBy: [desc(documents.createdAt)],
    with: { studentProfile: { with: { user: true } } },
  });
}

export async function getDocumentsForStudent(studentProfileId: string) {
  return db.query.documents.findMany({
    where: eq(documents.studentProfileId, studentProfileId),
    orderBy: [asc(documents.type), desc(documents.signedOn)],
  });
}

/**
 * Documents arrivés à échéance ou qui y arrivent sous 30 jours.
 *
 * Une autorisation périmée est un risque juridique silencieux : rien ne
 * la signale tant qu'on ne la cherche pas.
 */
export async function getExpiringDocuments() {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);

  return db.query.documents.findMany({
    where: and(isNotNull(documents.expiresOn), lte(documents.expiresOn, horizon)),
    orderBy: [asc(documents.expiresOn)],
    with: { studentProfile: { with: { user: true } } },
  });
}

export async function getExpiringDocumentCount(): Promise<number> {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(and(isNotNull(documents.expiresOn), lte(documents.expiresOn, horizon)));
  return Number(row?.count ?? 0);
}
