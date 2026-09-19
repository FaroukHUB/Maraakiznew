"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

type ActionResult = { success: true } | { success: false; error: string };

type DocumentType = "contract" | "authorization" | "identity" | "medical" | "other";

export async function createDocument(data: {
  title: string;
  type: DocumentType;
  studentProfileId?: string;
  fileUrl?: string;
  signedOn?: string;
  expiresOn?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };

    // Le lien doit être une adresse web : on ne stocke pas le fichier.
    if (data.fileUrl?.trim()) {
      try {
        const url = new URL(data.fileUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          return { success: false, error: "Le lien doit commencer par http ou https." };
        }
      } catch {
        return { success: false, error: "Le lien n'est pas une adresse valide." };
      }
    }

    const signedOn = data.signedOn ? new Date(data.signedOn) : null;
    const expiresOn = data.expiresOn ? new Date(data.expiresOn) : null;
    if (signedOn && expiresOn && expiresOn < signedOn) {
      return { success: false, error: "L'échéance précède la date de signature." };
    }

    await db.insert(documents).values({
      title: data.title.trim(),
      type: data.type,
      studentProfileId: data.studentProfileId || null,
      fileUrl: data.fileUrl?.trim() || null,
      signedOn,
      expiresOn,
      notes: data.notes?.trim() || null,
    });

    revalidatePath("/admin/documents");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du document." };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    await db.delete(documents).where(eq(documents.id, id));
    revalidatePath("/admin/documents");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
