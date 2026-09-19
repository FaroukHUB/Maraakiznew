"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, lessonProgress } from "@/db/schema";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function createCourse(data: {
  title: string;
  description?: string;
  programId?: string;
}): Promise<ActionResult> {
  try {
    if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };

    const [last] = await db
      .select({ max: sql<number>`coalesce(max(${courses.sortOrder}), 0)` })
      .from(courses);

    const [created] = await db
      .insert(courses)
      .values({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        programId: data.programId || null,
        sortOrder: Number(last?.max ?? 0) + 1,
        status: "draft",
      })
      .returning();

    revalidatePath("/admin/courses");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la création du cours." };
  }
}

export async function setCourseStatus(
  id: string,
  status: "draft" | "published"
): Promise<ActionResult> {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: { lessons: true },
    });
    if (!course) return { success: false, error: "Cours introuvable." };
    if (status === "published" && course.lessons.length === 0) {
      return { success: false, error: "Un cours sans leçon ne peut pas être publié." };
    }

    await db
      .update(courses)
      .set({ status, updatedAt: new Date() })
      .where(eq(courses.id, id));

    revalidatePath("/admin/courses");
    revalidatePath("/student/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
    if (!course) return { success: false, error: "Cours introuvable." };
    if (course.status === "published") {
      return {
        success: false,
        error: "Un cours publié ne se supprime pas. Dépubliez-le d'abord.",
      };
    }

    await db.delete(courses).where(eq(courses.id, id));
    revalidatePath("/admin/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

export async function addLesson(data: {
  courseId: string;
  title: string;
  type: "video" | "audio" | "text" | "exercise";
  contentUrl?: string;
  content?: string;
  durationMinutes?: number;
}): Promise<ActionResult> {
  try {
    if (!data.title.trim()) return { success: false, error: "Le titre est obligatoire." };

    if (data.contentUrl?.trim()) {
      try {
        const url = new URL(data.contentUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          return { success: false, error: "Le lien doit commencer par http ou https." };
        }
      } catch {
        return { success: false, error: "Le lien n'est pas une adresse valide." };
      }
    }

    const [last] = await db
      .select({ max: sql<number>`coalesce(max(${lessons.sortOrder}), -1)` })
      .from(lessons)
      .where(eq(lessons.courseId, data.courseId));

    await db.insert(lessons).values({
      courseId: data.courseId,
      title: data.title.trim(),
      type: data.type,
      contentUrl: data.contentUrl?.trim() || null,
      content: data.content?.trim() || null,
      durationMinutes: data.durationMinutes ?? null,
      sortOrder: Number(last?.max ?? -1) + 1,
    });

    revalidatePath(`/admin/courses/${data.courseId}`);
    revalidatePath("/student/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'ajout de la leçon." };
  }
}

export async function deleteLesson(
  id: string,
  courseId: string
): Promise<ActionResult> {
  try {
    await db.delete(lessons).where(eq(lessons.id, id));
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/student/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de la leçon." };
  }
}

/** Marque une leçon terminée, ou revient en arrière. */
export async function setLessonCompleted(
  lessonId: string,
  studentProfileId: string,
  completed: boolean
): Promise<ActionResult> {
  try {
    const existing = await db.query.lessonProgress.findFirst({
      where: and(
        eq(lessonProgress.lessonId, lessonId),
        eq(lessonProgress.studentProfileId, studentProfileId)
      ),
    });

    if (completed && !existing) {
      await db.insert(lessonProgress).values({ lessonId, studentProfileId });
    } else if (!completed && existing) {
      await db.delete(lessonProgress).where(eq(lessonProgress.id, existing.id));
    }

    revalidatePath("/student/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement." };
  }
}
