import { requireAdmin } from "@/lib/auth-utils";
import { getStudentCount, getAllStudentsWithDetails } from "@/data/students";
import { getWeekSessionCount, getUpcomingSessions } from "@/data/sessions";
import { getPendingPaymentCount } from "@/data/payments";
import { getAttendanceStats, getSessionsNeedingAttendance } from "@/data/attendance";
import { getAverageProgressByProgram } from "@/data/skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays, CreditCard, AlertTriangle, ClipboardCheck, ListChecks } from "lucide-react";
import Link from "next/link";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminDashboard() {
  await requireAdmin();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [
    studentCount,
    weekSessions,
    pendingPayments,
    upcomingSessions,
    students,
    attendance,
    sessionsToProcess,
    progressByProgram,
  ] = await Promise.all([
    getStudentCount(),
    getWeekSessionCount(),
    getPendingPaymentCount(),
    getUpcomingSessions(5),
    getAllStudentsWithDetails(),
    getAttendanceStats({ month: currentMonth }),
    getSessionsNeedingAttendance(),
    getAverageProgressByProgram(),
  ]);

  const studentsNeedingRenewal = students.filter(
    (s) =>
      s.activePack &&
      s.completedSessions >= s.activePack.totalSessions - 1
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
        <p className="text-muted-foreground mt-1">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Élèves</p>
              <p className="text-2xl font-bold">{studentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-quran/10 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-quran" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Séances cette semaine</p>
              <p className="text-2xl font-bold">{weekSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/admin/attendance">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assiduité ce mois</p>
                <p className="text-2xl font-bold">
                  {attendance.rated > 0 ? `${attendance.rate}%` : "—"}
                </p>
                {sessionsToProcess.length > 0 && (
                  <p className="text-xs text-warning-foreground">
                    {sessionsToProcess.length} séance
                    {sessionsToProcess.length > 1 ? "s" : ""} à traiter
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paiements en attente</p>
              <p className="text-2xl font-bold">{pendingPayments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-nourania/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-nourania-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A renouveler</p>
              <p className="text-2xl font-bold">{studentsNeedingRenewal.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progression par programme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Progression par programme
              </span>
              <Link
                href="/admin/skills"
                className="text-sm text-primary hover:underline font-normal"
              >
                Référentiel
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Moyenne des élèves avec un forfait actif
            </p>
          </CardHeader>
          <CardContent>
            {progressByProgram.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun forfait actif.
              </p>
            ) : (
              <div className="space-y-4">
                {progressByProgram.map((program) => (
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
                      {program.total === 0
                        ? "Référentiel vide"
                        : `${program.total} compétence${
                            program.total > 1 ? "s" : ""
                          } · ${program.studentCount} élève${
                            program.studentCount > 1 ? "s" : ""
                          }`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Prochaines séances
              <Link
                href="/admin/sessions"
                className="text-sm text-primary hover:underline font-normal"
              >
                Tout voir
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const student = students.find(
                    (s) => s.activePack?.id === session.subscriptionId
                  );
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {student?.name ?? "Élève"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {formatDate(session.scheduledAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.sessionNumber}/
                        {student?.activePack?.totalSessions ?? 8}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune séance planifiée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentsNeedingRenewal.length > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm font-medium text-warning-foreground">
                    Forfaits bientôt terminés
                  </p>
                  <ul className="mt-2 space-y-1">
                    {studentsNeedingRenewal.map((s) => (
                      <li key={s.id} className="text-xs text-muted-foreground">
                        {s.name} — {s.completedSessions}/{s.activePack?.totalSessions} séances
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingPayments > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">
                    {pendingPayments} paiement{pendingPayments > 1 ? "s" : ""} en attente
                  </p>
                  <Link
                    href="/admin/payments"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Voir les détails
                  </Link>
                </div>
              )}

              {studentsNeedingRenewal.length === 0 && pendingPayments === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tout est en ordre !
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
