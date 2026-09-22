"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assertCapability } from "@/lib/tenant";
import { resources, CAPABILITIES } from "@/db/schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function createResource(data: {
  title: string;
  description?: string;
  type: "pdf" | "video" | "audio" | "link" | "slide";
  url: string;
  programId: string | null;
  category?: string;
  sortOrder?: number;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.contentManage);
    await db.insert(resources).values({
      instituteId: institute,
      title: data.title,
      description: data.description || null,
      type: data.type,
      url: data.url,
      programId: data.programId,
      category: data.category || null,
      sortOrder: data.sortOrder ?? 0,
    });

    revalidatePath("/admin/resources");
    revalidatePath("/student/resources");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création." };
  }
}

export async function updateResource(
  resourceId: string,
  data: {
    title?: string;
    description?: string;
    type?: "pdf" | "video" | "audio" | "link" | "slide";
    url?: string;
    programId?: string | null;
    category?: string;
    sortOrder?: number;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.contentManage);
    await db
      .update(resources)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      })
      .where(and(eq(resources.instituteId, institute), eq(resources.id, resourceId)));

    revalidatePath("/admin/resources");
    revalidatePath("/student/resources");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const institute = await assertCapability(CAPABILITIES.contentManage);
    await db.delete(resources).where(and(eq(resources.instituteId, institute), eq(resources.id, resourceId)));

    revalidatePath("/admin/resources");
    revalidatePath("/student/resources");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
