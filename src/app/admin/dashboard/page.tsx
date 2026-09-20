import Link from "next/link";
import {
  AlertTriangle,
  BookMarked,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  ListChecks,
  Sun,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import { getStudentCount, getAllStudentsWithDetails } from "@/data/students";
import {
  getWeekSessionCount,
  getUpcomingSessions,
  getTodaySessions,
} from "@/data/sessions";
import { getPendingPaymentCount } from "@/data/payments";
import {
  getAttendanceStats,
  getSessionsNeedingAttendance,
} from "@/data/attendance";
import { getAverageProgressByProgram } from "@/data/skills";
import { getDueReviews } from "@/data/memorization";
import { getNotifications } from "@/data/notifications";
import { getStudentZones } from "@/data/timezones";
import { formatPortion } from "@/lib/quran";
import {
  GreetingHero,
  type HeroAction,
} from "@/components/dashboard/greeting-hero";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Panel } from "@/components/dashboard/panel";
import {
  TodayTimeline,
  type TimelineEntry,
} from "@/components/dashboard/today-timeline";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";
import { getDashboardLayout } from "@/data/preferences";
import { isVisible, orderedBlocks } from "@/lib/dashboard-blocks";


export default async function AdminDashboard() {
  const user = await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const layout = await getDashboardLayout(user.id);

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
    dueReviews,
    todaySessions,
    notifications,
    studentZones,
  ] = await Promise.all([
    getStudentCount(),
    getWeekSessionCount(),
    getPendingPaymentCount(),
    getUpcomingSessions(5),
    getAllStudentsWithDetails(),
    getAttendanceStats({ month: currentMonth }),
    getSessionsNeedingAttendance(),
    getAverageProgressByProgram(),
    getDueReviews(50),
    getTodaySessions(),
    getNotifications(),
    getStudentZones(),
  ]);

  const studentsNeedingRenewal = students.filter(
    (s) =>
      s.activePack && s.completedSessions >= s.activePack.totalSessions - 1,
  );

  // Les pastilles du bandeau reprennent les files de travail — même
  // source que la cloche de l'en-tête, jamais un second calcul.
  const heroActions: HeroAction[] = notifications.slice(0, 4).map((n) => ({
    label: n.label,
    count: n.count,
    href: n.href,
    tone: n.tone === "urgent" ? "warning" : "primary",
  }));

  const timeline: TimelineEntry[] = todaySessions.map((session) => {
    const studentName =
      session.subscription?.studentProfile?.user?.name ?? null;
    const groupName = session.group?.name ?? null;
    return {
      id: session.id,
      at: session.scheduledAt.toISOString(),
      title: groupName ?? studentName ?? "Séance",
      detail:
        groupName && studentName
          ? studentName
          : (session.subscription?.program?.name ?? null),
      status:
        session.status === "planned"
          ? "planned"
          : session.status === "completed"
            ? "completed"
            : session.status === "cancelled"
              ? "cancelled"
              : "other",
    };
  });

  const doneToday = timeline.filter((e) => e.status === "completed").length;

  // Chaque bloc est déclaré une fois, avec sa clé. L'ordre d'affichage
  // et les blocs masqués viennent de la préférence de la personne — voir
  // `lib/dashboard-blocks.ts`.
  const tiles: { key: string; node: React.ReactNode }[] = [
  {
    key: "tile.students",
    node: (
        <StatTile
          index={0}
          label="Élèves"
          value={studentCount}
          hint={`${students.filter((s) => s.activePack).length} avec un forfait actif`}
          href="/admin/students"
          icon={Users}
          tone="primary"
        />
    ),
  },
  {
    key: "tile.sessions",
    node: (
        <StatTile
          index={1}
          label="Séances cette semaine"
          value={weekSessions}
          hint={
            timeline.length > 0
              ? `${timeline.length} aujourd'hui, ${doneToday} déjà faite${doneToday > 1 ? "s" : ""}`
              : "Rien au programme aujourd'hui"
          }
          href="/admin/sessions"
          icon={CalendarDays}
          tone="quran"
        />
    ),
  },
  {
    key: "tile.attendance",
    node: (
        <StatTile
          index={2}
          label="Assiduité ce mois"
          value={attendance.rated > 0 ? attendance.rate : "—"}
          suffix={attendance.rated > 0 ? "%" : undefined}
          ratio={attendance.rated > 0 ? attendance.rate : undefined}
          hint={
            sessionsToProcess.length > 0
              ? `${sessionsToProcess.length} séance${sessionsToProcess.length > 1 ? "s" : ""} sans appel`
              : "Appel fait sur toutes les séances"
          }
          href="/admin/attendance"
          icon={ClipboardCheck}
          tone="success"
        />
    ),
  },
  {
    key: "tile.reviews",
    node: (
        <StatTile
          index={3}
          label="Révisions dues"
          value={dueReviews.length}
          hint={
            dueReviews.length > 0
              ? `${dueReviews.filter((r) => r.daysOverdue > 7).length} en retard de plus d'une semaine`
              : "Le cycle est à jour"
          }
          href="/admin/memorization"
          icon={BookMarked}
          tone="nourania"
        />
    ),
  },
  {
    key: "tile.payments",
    node: (
        <StatTile
          index={4}
          label="Paiements en attente"
          value={pendingPayments}
          hint={pendingPayments > 0 ? "À relancer" : "Rien à relancer"}
          href="/admin/payments"
          icon={CreditCard}
          tone="warning"
        />
    ),
  },
  {
    key: "tile.renewals",
    node: (
        <StatTile
          index={5}
          label="Forfaits à renouveler"
          value={studentsNeedingRenewal.length}
          hint={
            studentsNeedingRenewal.length > 0
              ? studentsNeedingRenewal
                  .map((s) => s.name)
                  .slice(0, 2)
                  .join(", ")
              : "Aucun forfait en fin de course"
          }
          href="/admin/subscriptions/new"
          icon={AlertTriangle}
          tone="destructive"
        />
    ),
  },
  ];

  const panels: { key: string; node: React.ReactNode }[] = [
  {
    key: "panel.today",
    node: (
        <Panel
          index={6}
          title="Aujourd'hui"
          icon={Sun}
          subtitle={
            timeline.length > 0
              ? `${timeline.length} séance${timeline.length > 1 ? "s" : ""} · ${doneToday} traitée${doneToday > 1 ? "s" : ""}`
              : undefined
          }
          action={{ label: "Toutes les séances", href: "/admin/sessions" }}
        >
          <TodayTimeline entries={timeline} timeZone={timeZone} />
        </Panel>
    ),
  },
  {
    key: "panel.reviews",
    node: (
        <Panel
          index={8}
          title="Révisions urgentes"
          icon={BookMarked}
          action={{ label: "Tout voir", href: "/admin/memorization" }}
        >
          {dueReviews.length === 0 ? (
            <Empty>Aucune révision en attente.</Empty>
          ) : (
            <div className="space-y-2">
              {dueReviews.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href="/admin/memorization"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-2.5 transition-colors hover:border-primary/30 hover:bg-accent/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.studentName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatPortion(
                        item.surahNumber,
                        item.ayahStart,
                        item.ayahEnd,
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs tabular-nums ${
                      item.daysOverdue > 7
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.daysOverdue <= 0
                      ? "aujourd'hui"
                      : `${item.daysOverdue} j de retard`}
                  </span>
                </Link>
              ))}
              {dueReviews.length > 5 && (
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  et {dueReviews.length - 5} autre
                  {dueReviews.length - 5 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </Panel>
    ),
  },
  {
    key: "panel.progress",
    node: (
        <Panel
          index={7}
          title="Progression"
          icon={ListChecks}
          subtitle="Moyenne par programme, élèves avec un forfait actif"
          action={{ label: "Référentiel", href: "/admin/skills" }}
        >
          {progressByProgram.length === 0 ? (
            <Empty>Aucun forfait actif.</Empty>
          ) : (
            <div className="space-y-4">
              {progressByProgram.map((program, index) => (
                <div key={program.programId}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {program.programName}
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums">
                      {program.total > 0 ? `${program.rate}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bar-fill h-full origin-left rounded-full bg-gradient-to-r from-primary to-nourania"
                      style={
                        {
                          width: `${program.rate}%`,
                          "--i": index,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {program.total === 0
                      ? "Référentiel vide"
                      : `${program.total} compétence${program.total > 1 ? "s" : ""} · ${program.studentCount} élève${program.studentCount > 1 ? "s" : ""}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
    ),
  },
  {
    key: "panel.upcoming",
    node: (
        <Panel
          index={9}
          title="Prochaines séances"
          icon={CalendarDays}
          action={{ label: "Tout voir", href: "/admin/sessions" }}
        >
          {upcomingSessions.length === 0 ? (
            <Empty>Aucune séance planifiée.</Empty>
          ) : (
            <div className="space-y-1">
              {upcomingSessions.map((session) => {
                const student = students.find(
                  (s) => s.activePack?.id === session.subscriptionId,
                );
                return (
                  <Link
                    key={session.id}
                    href={`/admin/sessions/${session.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {student?.name ?? "Élève"}
                      </p>
                      <p className="text-xs text-muted-foreground first-letter:uppercase">
                        {formatDateTime(session.scheduledAt, timeZone)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs tabular-nums"
                    >
                      {session.sessionNumber}/
                      {student?.activePack?.totalSessions ?? 8}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
    ),
  },
  {
    key: "panel.alerts",
    node: (
        <Panel index={10} title="Alertes" icon={AlertTriangle}>
          <div className="space-y-3">
            {studentsNeedingRenewal.length > 0 && (
              <div className="rounded-xl border border-warning/25 bg-warning/10 p-3">
                <p className="text-sm font-medium text-warning-foreground">
                  Forfaits bientôt terminés
                </p>
                <ul className="mt-2 space-y-1">
                  {studentsNeedingRenewal.map((s) => (
                    <li key={s.id} className="text-xs text-muted-foreground">
                      {s.name} — {s.completedSessions}/
                      {s.activePack?.totalSessions} séances
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingPayments > 0 && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">
                  {pendingPayments} paiement{pendingPayments > 1 ? "s" : ""}{" "}
                  en attente
                </p>
                <Link
                  href="/admin/payments"
                  className="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Voir les détails
                </Link>
              </div>
            )}

            {studentsNeedingRenewal.length === 0 && pendingPayments === 0 && (
              <Empty>Tout est en ordre.</Empty>
            )}
          </div>
        </Panel>
    ),
  },
  ];

  const shownTiles = tiles.filter((tile) => isVisible(layout, tile.key));
  const shownPanels = panels.filter((panel) => isVisible(layout, panel.key));
  const rank = (key: string) => {
    const index = orderedBlocks(layout).findIndex((block) => block.key === key);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  shownTiles.sort((a, b) => rank(a.key) - rank(b.key));
  shownPanels.sort((a, b) => rank(a.key) - rank(b.key));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <GreetingHero
        name={user.name}
        subtitle="Votre institut, d'un coup d'œil."
        actions={isVisible(layout, "hero.actions") ? heroActions : []}
        timeZone={timeZone}
        zones={isVisible(layout, "hero.zones") ? studentZones.zones : undefined}
        instituteZone={studentZones.instituteZone}
      />

      {shownTiles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shownTiles.map((tile, index) => (
            <div key={tile.key} style={{ "--i": index } as React.CSSProperties}>
              {tile.node}
            </div>
          ))}
        </div>
      )}

      {/* Les panneaux suivent l'ordre choisi. `grid-flow-dense` comble les
          trous laissés par « Aujourd'hui », qui occupe deux colonnes. */}
      {shownPanels.length > 0 && (
        <div className="grid grid-flow-dense items-start gap-5 lg:grid-cols-3">
          {shownPanels.map((panel) => (
            <div key={panel.key} className={PANEL_SPAN[panel.key] ?? ""}>
              {panel.node}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Les panneaux qui occupent plus d'une colonne. */
const PANEL_SPAN: Record<string, string> = {
  "panel.today": "lg:col-span-2",
};

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
