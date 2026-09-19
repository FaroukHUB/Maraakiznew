import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getCoursesForAdmin } from "@/data/courses";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonitorPlay } from "lucide-react";
import { CourseCreateForm } from "./course-create-form";

export default async function AdminCoursesPage() {
  await requireAdmin();
  const list = await getCoursesForAdmin();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Cours interactifs</h2>
        <p className="text-muted-foreground mt-1">
          Des parcours que l&apos;élève suit en autonomie, entre les séances.
          Ils ne consomment aucun forfait et n&apos;entrent pas dans
          l&apos;assiduité.
        </p>
      </div>

      <CourseCreateForm />

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MonitorPlay className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun cours</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{course.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {course.lessons.length} leçon{course.lessons.length > 1 ? "s" : ""}
                    {course.program && ` · ${course.program.name}`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    course.status === "published"
                      ? "text-success border-success/30 text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {course.status === "published" ? "Publié" : "Brouillon"}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
