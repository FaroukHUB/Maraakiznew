import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getAttendanceStats,
  getAttendanceByStudent,
  getSessionsNeedingAttendance,
} from "@/data/attendance";
import { getActiveGroupsForSelect } from "@/data/groups";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FiltersWrapper } from "@/components/admin/filters-wrapper";
import { StatusFilter, MonthFilter } from "@/components/admin/search-filter";
import { CheckCircle2, XCircle, CalendarClock, TrendingUp, AlertTriangle } from "lucide-react";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

function barColor(rate: number): string {
  if (rate >= 85) return "bg-success";
  if (rate >= 60) return "bg-warning";
  return "bg-destructive";
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; month?: string }>;
}) {
  await requireAdmin();
  const { group: groupId, month } = await searchParams;
  const filters = { groupId, month };

  const [stats, byStudent, toProcess, groups] = await Promise.all([
    getAttendanceStats(filters),
    getAttendanceByStudent(filters),
    getSessionsNeedingAttendance(),
    getActiveGroupsForSelect(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold">Assiduité</h2>
        <p className="text-muted-foreground mt-1">
          Taux de présence des élèves et séances restant à traiter
        </p>
      </div>

      <FiltersWrapper>
        <StatusFilter
          paramName="group"
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
        />
        <MonthFilter paramName="month" />
      </FiltersWrapper>

      {toProcess.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {toProcess.length} séance{toProcess.length > 1 ? "s" : ""} à traiter
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tant qu&apos;une séance passée reste « Planifiée » ou sans
                participante enregistrée, elle ne compte pas dans le taux
                d&apos;assiduité.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicateurs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assiduité</p>
              <p className={`text-2xl font-bold ${rateColor(stats.rate, stats.rated)}`}>
                {stats.rated > 0 ? `${stats.rate}%` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Présences</p>
              <p className="text-2xl font-bold">{stats.attended}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Absences</p>
              <p className="text-2xl font-bold">{stats.missed}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Excusées</p>
              <p className="text-2xl font-bold">{stats.excused}</p>
              <p className="text-xs text-muted-foreground">hors taux</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Par élève */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Par élève</CardTitle>
            <p className="text-sm text-muted-foreground">
              Les taux les plus faibles en premier
            </p>
          </CardHeader>
          <CardContent>
            {byStudent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucune présence enregistrée sur cette période.
              </p>
            ) : (
              <div className="space-y-4">
                {byStudent.map((student) => (
                  <Link
                    key={student.studentProfileId}
                    href={`/admin/students/${student.studentProfileId}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium group-hover:text-primary">
                        {student.studentName}
                      </span>
                      <span className={`text-sm font-bold ${rateColor(student.rate, student.rated)}`}>
                        {student.rated > 0 ? `${student.rate}%` : "—"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(student.rate)}`}
                        style={{ width: `${student.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {student.attended}/{student.rated} présences
                      {student.excused > 0 &&
                        `, ${student.excused} excusée${student.excused > 1 ? "s" : ""}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* À traiter */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Séances à traiter ({toProcess.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {toProcess.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Tout est à jour.
              </p>
            ) : (
              <div className="space-y-3">
                {toProcess.slice(0, 12).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.groupName ?? session.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {formatDate(session.scheduledAt)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1.5">
                        {session.reason === "status_pending"
                          ? SESSION_STATUS_LABELS[session.status] ?? session.status
                          : "Appel non fait"}
                      </Badge>
                    </div>
                    <Link href={`/admin/sessions/${session.id}`} className="shrink-0">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Traiter
                      </Button>
                    </Link>
                  </div>
                ))}
                {toProcess.length > 12 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    et {toProcess.length - 12} autre{toProcess.length - 12 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
