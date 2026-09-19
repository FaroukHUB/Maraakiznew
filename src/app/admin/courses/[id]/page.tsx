import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getCourseById } from "@/data/courses";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { LessonsManager } from "./lessons-manager";

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux cours
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold">{course.title}</h2>
        <Badge
          variant="outline"
          className={course.status === "published" ? "text-success border-success/30" : ""}
        >
          {course.status === "published" ? "Publié" : "Brouillon"}
        </Badge>
      </div>

      <LessonsManager
        courseId={course.id}
        status={course.status}
        lessons={course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationMinutes: l.durationMinutes,
        }))}
      />
    </div>
  );
}
