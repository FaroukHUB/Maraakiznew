import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getDueReviews } from "@/data/memorization";
import { formatPortion } from "@/lib/quran";
import { REVIEW_INTERVALS_DAYS } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, AlarmClock } from "lucide-react";
import { ReviewButtons } from "./review-buttons";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function overdueLabel(days: number): { text: string; className: string } {
  if (days <= 0) return { text: "À faire", className: "text-primary border-primary/30" };
  if (days === 1) return { text: "1 jour de retard", className: "text-warning-foreground border-warning/30" };
  if (days <= 7) return { text: `${days} jours de retard`, className: "text-warning-foreground border-warning/30" };
  return { text: `${days} jours de retard`, className: "text-destructive border-destructive/30" };
}

export default async function AdminMemorizationPage() {
  await requireAdmin();
  const due = await getDueReviews();

  // Regroupées par élève : on révise avec une élève, pas avec une portion.
  const byStudent = new Map<string, { name: string; items: typeof due }>();
  for (const item of due) {
    const entry = byStudent.get(item.studentProfileId) ?? {
      name: item.studentName,
      items: [] as typeof due,
    };
    entry.items.push(item);
    byStudent.set(item.studentProfileId, entry);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Révisions</h2>
        <p className="text-muted-foreground mt-1">
          Les portions mémorisées dont la révision est due. L&apos;intervalle
          s&apos;allonge à chaque récitation sûre :{" "}
          {REVIEW_INTERVALS_DAYS.join(", ")} jours.
        </p>
      </div>

      {due.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucune révision en attente</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Les portions mémorisées s&apos;ajoutent depuis la fiche d&apos;une
              élève, et réapparaissent ici à la date prévue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {due.length} portion{due.length > 1 ? "s" : ""} à réviser chez{" "}
            {byStudent.size} élève{byStudent.size > 1 ? "s" : ""}
          </p>

          {[...byStudent].map(([studentProfileId, { name, items }]) => (
            <Card key={studentProfileId}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                  <Link
                    href={`/admin/students/${studentProfileId}`}
                    className="hover:text-primary"
                  >
                    {name}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {items.length} portion{items.length > 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {items.map((item) => {
                    const overdue = overdueLabel(item.daysOverdue);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {formatPortion(item.surahNumber, item.ayahStart, item.ayahEnd)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={`text-xs ${overdue.className}`}>
                              <AlarmClock className="h-3 w-3 mr-1" />
                              {overdue.text}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.lastReviewedAt
                                ? `Dernière révision le ${formatDate(item.lastReviewedAt)}`
                                : "Jamais révisée"}
                            </span>
                          </div>
                        </div>
                        <ReviewButtons itemId={item.id} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
