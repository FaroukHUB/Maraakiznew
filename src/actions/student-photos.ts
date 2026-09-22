"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import {
  studentPhotos,
  ALLOWED_IMAGE_TYPES,
  MAX_STUDENT_PHOTO_BYTES,
  MAX_PHOTOS_PER_STUDENT,
  CAPABILITIES,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { decodeImageDataUrl, sniffImageType } from "@/lib/image-bytes";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Ajouter une photo à la galerie d'une élève.
 *
 * ── Trois garde-fous, et pourquoi chacun ──
 *
 * 1. Le CONTENU décide du format, pas le nom du fichier ni ce que
 *    déclare le navigateur (voir `sniffImageType`).
 * 2. La taille est plafonnée APRÈS décodage : une chaîne base64 pèse un
 *    tiers de plus que les octets qu'elle transporte.
 * 3. Le NOMBRE de photos par élève est plafonné. Sans ce plafond, la
 *    galerie ferait enfler la base sans limite — voir la règle portée
 *    par `student_photos` dans le schéma.
 *
 * Ce commentaire fait foi.
 */
export async function addStudentPhoto(
  profileId: string,
  dataUrl: string,
  caption: string,
  takenOn: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);

    const decoded = decodeImageDataUrl(dataUrl);
    if (!decoded) return { success: false, error: "Fichier illisible." };

    const { declared, bytes } = decoded;
    if (!ALLOWED_IMAGE_TYPES.includes(declared as never)) {
      return { success: false, error: "Formats acceptés : JPEG, PNG ou WebP." };
    }
    if (bytes.byteLength === 0) {
      return { success: false, error: "Fichier vide." };
    }
    if (bytes.byteLength > MAX_STUDENT_PHOTO_BYTES) {
      return {
        success: false,
        error: `Photo trop lourde (${Math.round(bytes.byteLength / 1000)} Ko pour ${Math.round(MAX_STUDENT_PHOTO_BYTES / 1000)} Ko au maximum).`,
      };
    }

    const real = sniffImageType(bytes);
    if (!real) return { success: false, error: "Ce fichier n'est pas une image." };
    if (real !== declared) {
      return {
        success: false,
        error: "Le contenu du fichier ne correspond pas à son format.",
      };
    }

    const [existing] = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentPhotos)
      .where(
        and(
          eq(studentPhotos.studentProfileId, profileId),
          eq(studentPhotos.instituteId, institute)
        )
      );

    if (Number(existing?.count ?? 0) >= MAX_PHOTOS_PER_STUDENT) {
      return {
        success: false,
        error: `Galerie pleine (${MAX_PHOTOS_PER_STUDENT} photos au maximum). Supprimez-en une pour en ajouter une autre.`,
      };
    }

    await db.insert(studentPhotos).values({
      instituteId: institute,
      studentProfileId: profileId,
      caption: caption.trim() || null,
      takenOn: /^\d{4}-\d{2}-\d{2}$/.test(takenOn) ? takenOn : null,
      mimeType: real,
      byteSize: bytes.byteLength,
      data: bytes,
    });

    revalidatePath(`/admin/students/${profileId}`);
    revalidatePath("/student/profile");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'envoi de la photo." };
  }
}

export async function deleteStudentPhoto(photoId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const institute = await assertCapability(CAPABILITIES.studentsManage);
    const [removed] = await db
      .delete(studentPhotos)
      .where(and(eq(studentPhotos.instituteId, institute), eq(studentPhotos.id, photoId)))
      .returning({ profileId: studentPhotos.studentProfileId });

    if (!removed) return { success: false, error: "Photo introuvable." };

    revalidatePath(`/admin/students/${removed.profileId}`);
    revalidatePath("/student/profile");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
