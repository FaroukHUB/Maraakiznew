import { eq } from "drizzle-orm";
import { db } from "@/db";
import { instituteAssets, type AssetKey } from "@/db/schema";

/**
 * L'adresse d'une image de l'institut, ou null si elle n'existe pas.
 *
 * L'horodatage est ajouté à l'adresse : sans lui, le navigateur
 * garderait l'ancienne image après un remplacement, et l'institut
 * croirait que l'envoi a échoué.
 */
export async function getAssetUrl(key: AssetKey): Promise<string | null> {
  const asset = await db.query.instituteAssets.findFirst({
    where: eq(instituteAssets.key, key),
    columns: { updatedAt: true },
  });
  if (!asset) return null;
  return `/api/institute/${key}?v=${asset.updatedAt.getTime()}`;
}
