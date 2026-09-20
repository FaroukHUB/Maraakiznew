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

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return { success: false, error: "Fichier illisible." };
    }

    const declared = match[1];
    if (!ALLOWED_IMAGE_TYPES.includes(declared as never)) {
      return {
        success: false,
        error: "Formats acceptés : JPEG, PNG ou WebP.",
      };
    }

    const bytes = Buffer.from(match[2], "base64");
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

/**
 * Le vrai format, lu dans les octets.
 *
 * Les trois formats acceptés ont une signature en tête de fichier ; rien
 * d'autre n'est reconnu, et donc rien d'autre n'est accepté.
 */
function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
