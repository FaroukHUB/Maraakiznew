"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Circle, ExternalLink } from "lucide-react";
import { setLessonCompleted } from "@/actions/courses";
import { LESSON_TYPE_LABELS } from "@/lib/constants";

type Lesson = {
  id: string;
  title: string;
  type: string;
  contentUrl: string | null;
  durationMinutes: number | null;
  completed: boolean;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  lessons: Lesson[];
  completedCount: number;
  totalLessons: number;
  rate: number;
};

export function CourseList({
  studentProfileId,
  courses,
}: {
  studentProfileId: string;
  courses: Course[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  // Statut choisi localement, le temps que router.refresh() revienne.
  const [local, setLocal] = useState<Record<string, boolean>>({});

  const isDone = (lesson: Lesson) => local[lesson.id] ?? lesson.completed;

  async function toggle(lesson: Lesson) {
    const next = !isDone(lesson);
    setPending(lesson.id);
    setLocal((prev) => ({ ...prev, [lesson.id]: next }));

    const result = await setLessonCompleted(lesson.id, studentProfileId, next);
    if (result.success) router.refresh();
    else setLocal((prev) => ({ ...prev, [lesson.id]: !next }));
    setPending(null);
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => {
        const done = course.lessons.filter(isDone).length;
        const rate =
          course.totalLessons > 0 ? Math.round((done / course.totalLessons) * 100) : 0;

        return (
          <Card key={course.id}>
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{course.title}</p>
                  <span className="text-sm font-bold shrink-0">{rate}%</span>
                </div>
                {course.description && (
                  <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                )}
                <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {done}/{course.totalLessons} leçon{course.totalLessons > 1 ? "s" : ""} terminée
                  {done > 1 ? "s" : ""}
                </p>
              </div>

              <div className="divide-y divide-border border-t border-border">
                {course.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between gap-3 py-2.5">
                    <button
                      onClick={() => toggle(lesson)}
                      disabled={pending === lesson.id}
                      className="flex items-center gap-3 min-w-0 text-left disabled:opacity-50"
                    >
                      {isDone(lesson) ? (
                        <Check className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="min-w-0">
                        <span className="text-sm block truncate">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {LESSON_TYPE_LABELS[lesson.type]}
                          {lesson.durationMinutes && ` · ${lesson.durationMinutes} min`}
                        </span>
                      </span>
                    </button>
                    {lesson.contentUrl && (
                      <a
                        href={lesson.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline shrink-0"
                        aria-label={`Ouvrir ${lesson.title}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Cochez une leçon une fois suivie — c&apos;est ce qui fait avancer
                votre progression.
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
