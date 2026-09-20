import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ClipboardCheck, ListChecks, BookMarked } from "lucide-react";
import type { ProgramProgressSnapshot } from "@/db/schema";
import { formatDate } from "@/lib/datetime";

export type ReportCardData = {
  title: string;
  periodStart: Date;
  periodEnd: Date;
  status: "draft" | "published";
  generalComment: string | null;
  sessionsCount: number;
  attendanceAttended: number;
  attendanceMissed: number;
  attendanceExcused: number;
  attendanceRate: number;
  skillsAcquired: number;
  skillsTotal: number;
  skillsAcquiredInPeriod: number;
  programProgress: ProgramProgressSnapshot[];
  memorizedAyahs: number;
  memorizedPortionsInPeriod: number;
  reviewsInPeriod: number;
  generatedAt: Date;
};


function rateColor(rate: number): string {
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

/**
 * Rendu d'un bulletin, partagé entre l'espace admin et l'espace élève.
 *
 * Les chiffres viennent du constat figé, jamais d'un recalcul : ce
 * composant n'interroge pas la base.
 */
export function ReportCardView({
  studentName,
  card,
  timeZone,
}: {
  studentName: string;
  card: ReportCardData;
  /**
   * Fuseau d'affichage des dates du bulletin. Côté administration c'est
   * celui de l'institut, côté élève le sien : une période « du 1er au
   * 30 septembre » ne doit pas devenir « du 31 août » en changeant
   * d'espace.
   */
  timeZone: string;
}) {
  return (
    <div className="space-y-6 print:space-y-4">
      {/* En-tête */}
      <div className="border-b border-border pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{card.title}</h1>
            <p className="text-muted-foreground mt-1">{studentName}</p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Du {formatDate(card.periodStart, timeZone)} au {formatDate(card.periodEnd, timeZone)}
            </p>
          </div>
          {card.status === "draft" && (
            <Badge variant="outline" className="print:hidden">
              Brouillon
            </Badge>
          )}
        </div>
      </div>

      {/* Chiffres de la période */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Sur la période
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ClipboardCheck className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Assiduité</span>
              </div>
              <p className={`text-2xl font-bold ${rateColor(card.attendanceRate)}`}>
                {card.attendanceAttended + card.attendanceMissed > 0
                  ? `${card.attendanceRate}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {card.attendanceAttended} présence
                {card.attendanceAttended > 1 ? "s" : ""}, {card.attendanceMissed}{" "}
                absence{card.attendanceMissed > 1 ? "s" : ""}
                {card.attendanceExcused > 0 &&
                  `, ${card.attendanceExcused} excusée${card.attendanceExcused > 1 ? "s" : ""}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Séances</span>
              </div>
              <p className="text-2xl font-bold">{card.sessionsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">sur la période</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ListChecks className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Acquis</span>
              </div>
              <p className="text-2xl font-bold">{card.skillsAcquiredInPeriod}</p>
              <p className="text-xs text-muted-foreground mt-1">
                compétence{card.skillsAcquiredInPeriod > 1 ? "s" : ""} validée
                {card.skillsAcquiredInPeriod > 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BookMarked className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Mémorisation</span>
              </div>
              <p className="text-2xl font-bold">{card.memorizedPortionsInPeriod}</p>
              <p className="text-xs text-muted-foreground mt-1">
                nouvelle{card.memorizedPortionsInPeriod > 1 ? "s" : ""} portion
                {card.memorizedPortionsInPeriod > 1 ? "s" : ""}
                {card.reviewsInPeriod > 0 && `, ${card.reviewsInPeriod} révision${card.reviewsInPeriod > 1 ? "s" : ""}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* État cumulé */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Où en est l&apos;élève
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-5">
            {card.programProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun programme suivi.
              </p>
            ) : (
              card.programProgress.map((program) => (
                <div key={program.programId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{program.programName}</span>
                    <span className="text-sm font-bold">
                      {program.total > 0 ? `${program.rate}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${program.rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {program.acquired}/{program.total} compétences acquises
                  </p>
                </div>
              ))
            )}

            <div className="pt-4 border-t border-border flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span>
                <span className="text-muted-foreground">Total acquis : </span>
                <span className="font-medium">
                  {card.skillsAcquired}/{card.skillsTotal}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground">Versets mémorisés : </span>
                <span className="font-medium">{card.memorizedAyahs}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appréciation */}
      {card.generalComment && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Appréciation
          </h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {card.generalComment}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Chiffres relevés le {formatDate(card.generatedAt, timeZone)}.
      </p>
    </div>
  );
}
