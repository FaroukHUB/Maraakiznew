import Link from "next/link";
import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getPublishedReportCards } from "@/data/report-cards";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight } from "lucide-react";
import { formatPeriod } from "@/lib/datetime";
import { getViewerTimezone } from "@/data/timezones";

export default async function StudentReportCardsPage() {
  const user = await requireStudent();
  const timeZone = await getViewerTimezone(user.id);
  // getStudentByUserId renvoie l'utilisateur, le profil élève est dans
  // .profile — c'est SON id qui référence les bulletins.
  const student = await getStudentByUserId(user.id);
  const cards = student ? await getPublishedReportCards(student.profile.id) : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Mes bulletins</h2>
        <p className="text-muted-foreground mt-1">
          Le bilan de votre travail, période par période.
        </p>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun bulletin pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vos bulletins apparaîtront ici dès qu&apos;ils seront remis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {cards.map((card) => (
              <Link
                key={card.id}
                href={`/student/report-cards/${card.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatPeriod(card.periodStart, card.periodEnd, timeZone)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold">{card.attendanceRate}%</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
