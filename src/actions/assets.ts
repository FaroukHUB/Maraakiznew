"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  instituteAssets,
  ASSET_KEYS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type AssetKey,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { decodeImageDataUrl, sniffImageType } from "@/lib/image-bytes";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Enregistre une image de l'institut.
 *
 * ── Ce qui est vérifié, et pourquoi ──
 *
 * Le type déclaré par le navigateur ne prouve rien : on relit les
 * PREMIERS OCTETS du fichier. Une page HTML renommée en « .jpg » serait
 * sinon servie telle quelle par notre route, avec le type qu'on lui
 * aurait fait confiance de déclarer. Ce commentaire fait foi.
 *
 * La taille est plafonnée après décodage, pas avant : une chaîne base64
 * fait un tiers de plus que les octets qu'elle transporte.
 */
export async function saveInstituteImage(
  key: AssetKey,
  dataUrl: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!Object.values(ASSET_KEYS).includes(key)) {
      return { success: false, error: "Image inconnue." };
    }

    const decoded = decodeImageDataUrl(dataUrl);
    if (!decoded) {
      return { success: false, error: "Fichier illisible." };
    }

    const { declared, bytes } = decoded;
    if (!ALLOWED_IMAGE_TYPES.includes(declared as never)) {
      return {
        success: false,
        error: "Formats acceptés : JPEG, PNG ou WebP.",
      };
    }

    if (bytes.byteLength === 0) {
      return { success: false, error: "Fichier vide." };
    }
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return {
        success: false,
        error: `Image trop lourde (${Math.round(bytes.byteLength / 1000)} Ko pour ${Math.round(MAX_IMAGE_BYTES / 1000)} Ko au maximum).`,
      };
    }

    const real = sniffImageType(bytes);
    if (!real) {
      return { success: false, error: "Ce fichier n'est pas une image." };
    }
    if (real !== declared) {
      return {
        success: false,
        error: "Le contenu du fichier ne correspond pas à son format.",
      };
    }

    await db
      .insert(instituteAssets)
      .values({ key, mimeType: real, byteSize: bytes.byteLength, data: bytes })
      .onConflictDoUpdate({
        target: instituteAssets.key,
        set: {
          mimeType: real,
          byteSize: bytes.byteLength,
          data: bytes,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/admin", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}

export async function deleteInstituteImage(key: AssetKey): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.delete(instituteAssets).where(eq(instituteAssets.key, key));
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
