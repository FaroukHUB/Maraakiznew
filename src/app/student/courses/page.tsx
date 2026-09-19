import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getCoursesForStudent } from "@/data/courses";
import { Card, CardContent } from "@/components/ui/card";
import { MonitorPlay } from "lucide-react";
import { CourseList } from "./course-list";

export default async function StudentCoursesPage() {
  const user = await requireStudent();
  // getStudentByUserId renvoie l'utilisateur ; le profil est dans .profile.
  const student = await getStudentByUserId(user.id);
  const list = student ? await getCoursesForStudent(student.profile.id) : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Cours en autonomie</h2>
        <p className="text-muted-foreground mt-1">
          À suivre à votre rythme, entre les séances.
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MonitorPlay className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun cours disponible</p>
          </CardContent>
        </Card>
      ) : (
        student && <CourseList studentProfileId={student.profile.id} courses={list} />
      )}
    </div>
  );
}
