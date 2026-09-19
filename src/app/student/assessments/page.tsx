import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getResultsForStudent, getStudentAverage, TYPE_LABELS } from "@/data/assessments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function StudentAssessmentsPage() {
  const user = await requireStudent();
  // getStudentByUserId renvoie l'utilisateur ; le profil est dans .profile.
  const student = await getStudentByUserId(user.id);
  const results = student ? await getResultsForStudent(student.profile.id) : [];
  const average = student ? await getStudentAverage(student.profile.id) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Mes évaluations</h2>
        <p className="text-muted-foreground mt-1">
          {average !== null
            ? `Moyenne générale : ${average}%`
            : "Aucune évaluation publiée pour le moment."}
        </p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun résultat</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vos notes apparaîtront ici dès qu&apos;une évaluation sera publiée.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {results.map((result) => (
              <div key={result.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{result.assessment.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[result.assessment.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(result.assessment.heldOn)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">
                      {result.score}/{result.assessment.maxScore}
                    </p>
                    <p
                      className={`text-xs ${
                        result.percentage >= 50 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {result.percentage}%
                    </p>
                  </div>
                </div>
                {result.comment && (
                  <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                    {result.comment}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
