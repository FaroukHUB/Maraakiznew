import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, lessonProgress } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export { LESSON_TYPE_LABELS } from "@/lib/constants";

export async function getCoursesForAdmin() {
  const institute = await requireInstitute();
  return db.query.courses.findMany({
    where: eq(courses.instituteId, institute),
    orderBy: [asc(courses.sortOrder), asc(courses.title)],
    with: { program: true, lessons: { orderBy: [asc(lessons.sortOrder)] } },
  });
}

export async function getCourseById(id: string) {
  const institute = await requireInstitute();
  return db.query.courses.findFirst({
    where: and(eq(courses.id, id), eq(courses.instituteId, institute)),
    with: { program: true, lessons: { orderBy: [asc(lessons.sortOrder)] } },
  });
}

/**
 * Cours publiés, annotés de la progression de l'élève.
 *
 * La progression compte les leçons TERMINÉES : ouvrir une vidéo ne veut
 * pas dire l'avoir suivie.
 */
export async function getCoursesForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  const published = await db.query.courses.findMany({
    where: and(
      eq(courses.status, "published"),
      eq(courses.instituteId, institute)
    ),
    orderBy: [asc(courses.sortOrder), asc(courses.title)],
    with: { program: true, lessons: { orderBy: [asc(lessons.sortOrder)] } },
  });

  const lessonIds = published.flatMap((c) => c.lessons.map((l) => l.id));
  const done =
    lessonIds.length > 0
      ? await db.query.lessonProgress.findMany({
          where: and(
            inArray(lessonProgress.lessonId, lessonIds),
            eq(lessonProgress.instituteId, institute)
          ),
        })
      : [];

  const completed = new Set(
    done.filter((d) => d.studentProfileId === studentProfileId).map((d) => d.lessonId)
  );

  return published.map((course) => {
    const total = course.lessons.length;
    const doneCount = course.lessons.filter((l) => completed.has(l.id)).length;
    return {
      ...course,
      lessons: course.lessons.map((l) => ({ ...l, completed: completed.has(l.id) })),
      completedCount: doneCount,
      totalLessons: total,
      rate: total > 0 ? Math.round((doneCount / total) * 1000) / 10 : 0,
    };
  });
}
