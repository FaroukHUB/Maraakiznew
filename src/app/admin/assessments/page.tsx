import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getAssessmentsForAdmin, TYPE_LABELS } from "@/data/assessments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus } from "lucide-react";
import { FiltersWrapper } from "@/components/admin/filters-wrapper";
import { StatusFilter } from "@/components/admin/search-filter";
import { formatDayMonthYear } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";


export default async function AdminAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const { type } = await searchParams;
  let list = await getAssessmentsForAdmin();
  if (type) list = list.filter((a) => a.type === type);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Évaluations</h2>
          <p className="text-muted-foreground mt-1">
            Quiz, évaluations, tests de niveau et concours — même mécanique,
            barème et notes.
          </p>
        </div>
        <Link href="/admin/assessments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle évaluation
          </Button>
        </Link>
      </div>

      <FiltersWrapper>
        <StatusFilter
          paramName="type"
          options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </FiltersWrapper>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucune évaluation</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Les notes restent invisibles pour les élèves tant que
              l&apos;évaluation est en brouillon.
            </p>
            <Link href="/admin/assessments/new">
              <Button>Créer la première évaluation</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/admin/assessments/${assessment.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{assessment.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[assessment.type]}
                    </Badge>
                    {assessment.program && (
                      <span className="text-xs text-muted-foreground">
                        {assessment.program.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDayMonthYear(assessment.heldOn, timeZone)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <p className="text-sm font-semibold">
                      {assessment.averageScore !== null
                        ? `${assessment.averageScore}/${assessment.maxScore}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assessment.resultCount} note{assessment.resultCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      assessment.status === "published"
                        ? "text-success border-success/30 text-xs"
                        : "text-muted-foreground text-xs"
                    }
                  >
                    {assessment.status === "published" ? "Publiée" : "Brouillon"}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
