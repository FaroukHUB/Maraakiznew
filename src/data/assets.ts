import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  instituteAssets,
  instituteImages,
  DEFAULT_INSTITUTE_ID,
  type AssetKey,
} from "@/db/schema";
import { getActiveInstitute } from "@/lib/tenant";

/**
 * L'adresse d'une image de l'institut, ou null si elle n'existe pas.
 *
 * L'horodatage est ajouté à l'adresse : sans lui, le navigateur
 * garderait l'ancienne image après un remplacement, et l'institut
 * croirait que l'envoi a échoué.
 *
 * L'établissement est porté par l'adresse (`e=`) : la route qui sert
 * l'image est publique et n'a pas de session à interroger. Une image de
 * bandeau n'est pas un secret — c'est un logo sur un site — mais elle
 * doit être CELLE du bon établissement. Ce commentaire fait foi.
 */
export async function getAssetUrl(
  key: AssetKey,
  instituteId?: string
): Promise<string | null> {
  const institute =
    instituteId ?? (await getActiveInstitute())?.id ?? DEFAULT_INSTITUTE_ID;

  const own = await db.query.instituteImages.findFirst({
    where: and(
      eq(instituteImages.instituteId, institute),
      eq(instituteImages.key, key)
    ),
    columns: { updatedAt: true },
  });
  if (own) {
    return `/api/institute/${key}?e=${institute}&v=${own.updatedAt.getTime()}`;
  }

  // Repli sur la table historique, pour le seul établissement d'origine :
  // son bandeau y vit encore tant qu'il n'a pas été remplacé.
  if (institute !== DEFAULT_INSTITUTE_ID) return null;
  const legacy = await db.query.instituteAssets.findFirst({
    where: eq(instituteAssets.key, key),
    columns: { updatedAt: true },
  });
  if (!legacy) return null;
  return `/api/institute/${key}?e=${institute}&v=${legacy.updatedAt.getTime()}`;
}
