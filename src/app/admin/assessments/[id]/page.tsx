import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getAssessmentById, TYPE_LABELS } from "@/data/assessments";
import { getAllStudentsWithDetails } from "@/data/students";
import { getGroupById } from "@/data/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { GradingPanel } from "./grading-panel";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function AdminAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const assessment = await getAssessmentById(id);
  if (!assessment) notFound();

  // Qui est concerné : le groupe s'il y en a un, sinon toutes les élèves.
  let candidates: { profileId: string; name: string }[];
  if (assessment.groupId) {
    const group = await getGroupById(assessment.groupId);
    candidates =
      group?.members.map((m) => ({
        profileId: m.studentProfileId,
        name: m.studentProfile.user.name,
      })) ?? [];
  } else {
    const students = await getAllStudentsWithDetails();
    candidates = students.map((s) => ({ profileId: s.profile.id, name: s.name }));
  }

  const graded = assessment.results.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/assessments"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux évaluations
      </Link>

      <div>
        <h2 className="text-2xl font-bold">{assessment.title}</h2>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline">{TYPE_LABELS[assessment.type]}</Badge>
          {assessment.program && (
            <Badge variant="outline">{assessment.program.name}</Badge>
          )}
          {assessment.group && <Badge variant="outline">{assessment.group.name}</Badge>}
          <span className="text-sm text-muted-foreground">
            {formatDate(assessment.heldOn)} · barème {assessment.maxScore}
          </span>
        </div>
        {assessment.description && (
          <p className="text-muted-foreground mt-3">{assessment.description}</p>
        )}
      </div>

      <GradingPanel
        assessmentId={assessment.id}
        maxScore={assessment.maxScore}
        status={assessment.status}
        type={assessment.type}
        candidates={candidates}
        results={assessment.results.map((r) => ({
          studentProfileId: r.studentProfileId,
          score: r.score,
          comment: r.comment,
          resultingLevel: r.resultingLevel,
        }))}
      />

      {graded > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {assessment.results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-muted-foreground w-6">
                      {result.rank}
                    </span>
                    <Link
                      href={`/admin/students/${result.studentProfileId}`}
                      className="text-sm font-medium hover:text-primary truncate"
                    >
                      {result.studentProfile.user.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold">
                      {result.score}/{assessment.maxScore}
                    </span>
                    <span
                      className={`text-xs ${
                        result.percentage >= 50 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {result.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
