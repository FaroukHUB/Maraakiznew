"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Send, Undo2 } from "lucide-react";
import { addLesson, deleteLesson, setCourseStatus, deleteCourse } from "@/actions/courses";
import { LESSON_TYPE_LABELS } from "@/lib/constants";

type Lesson = {
  id: string;
  title: string;
  type: string;
  durationMinutes: number | null;
};

export function LessonsManager({
  courseId,
  status,
  lessons,
}: {
  courseId: string;
  status: "draft" | "published";
  lessons: Lesson[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("video");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    if (result.success) router.refresh();
    else setError(result.error ?? "Erreur inattendue.");
    setPending(false);
    return result.success;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
          <span>Leçons ({lessons.length})</span>
          <div className="flex gap-2">
            {status === "draft" ? (
              <>
                <Button
                  size="sm"
                  disabled={pending || lessons.length === 0}
                  onClick={() => run(() => setCourseStatus(courseId, "published"))}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={pending}
                  onClick={async () => {
                    const done = await run(() => deleteCourse(courseId));
                    if (done) router.push("/admin/courses");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => setCourseStatus(courseId, "draft"))}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Dépublier
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune leçon. Un cours sans leçon ne peut pas être publié.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {LESSON_TYPE_LABELS[lesson.type]}
                      {lesson.durationMinutes && ` · ${lesson.durationMinutes} min`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Supprimer la leçon"
                  onClick={() => run(() => deleteLesson(lesson.id, courseId))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {adding ? (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la leçon" autoFocus />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {Object.entries(LESSON_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Lien (https://...)" />
              <Input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Durée (min)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending || !title.trim()}
                onClick={async () => {
                  const done = await run(() =>
                    addLesson({
                      courseId,
                      title,
                      type: type as "video" | "audio" | "text" | "exercise",
                      contentUrl: url || undefined,
                      durationMinutes: duration ? parseInt(duration, 10) : undefined,
                    })
                  );
                  if (done) {
                    setTitle("");
                    setUrl("");
                    setDuration("");
                    setAdding(false);
                  }
                }}
              >
                Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une leçon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
