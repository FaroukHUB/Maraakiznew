import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getAttendanceStats,
  getAttendanceByStudent,
  getAttendanceByGroup,
  getAttendanceByTeacher,
  getAttendanceByMonth,
  getSessionsNeedingAttendance,
  PENDING_REASON_LABELS,
} from "@/data/attendance";
import { getActiveGroupsForSelect } from "@/data/groups";
import { getActiveStaffForSelect } from "@/data/staff";
import { getInstituteTimezone } from "@/data/settings";
import { formatDateTime, formatMonth } from "@/lib/datetime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabLinks } from "@/components/ui/tab-links";
import { AttendanceFilters } from "./attendance-filters";
import { AttendanceView, type AttendanceRow } from "./attendance-view";

const VUES = ["eleves", "groupes", "enseignantes", "mois"] as const;
type Vue = (typeof VUES)[number];

function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "text-muted-foreground";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

/** « 2026-09 » → « septembre 2026 », sans repasser par un instant. */
function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return formatMonth(new Date(Date.UTC(year, month - 1, 15, 12)), "UTC");
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; groupe?: string; prof?: string; mois?: string }>;
}) {
  await requireAdmin();
  const { vue: askedVue, groupe, prof, mois } = await searchParams;

  // Une vue inconnue dans l'adresse ramène à la première, sans erreur.
  const vue: Vue = VUES.includes(askedVue as Vue) ? (askedVue as Vue) : "eleves";

  const timeZone = await getInstituteTimezone();
  const filters = { groupId: groupe, staffMemberId: prof, month: mois };

  const [stats, byStudent, byGroup, byTeacher, byMonth, toProcess, groups, teachers] =
    await Promise.all([
      getAttendanceStats(filters),
      getAttendanceByStudent(filters),
      getAttendanceByGroup(filters),
      getAttendanceByTeacher(filters),
      getAttendanceByMonth(timeZone, { groupId: groupe, staffMemberId: prof }),
      getSessionsNeedingAttendance(),
      getActiveGroupsForSelect(),
      getActiveStaffForSelect(),
    ]);

  // Les mois proposés au filtre sont ceux où il s'est passé quelque
  // chose : proposer douze mois vides ferait chercher pour rien.
  const months = [...byMonth]
    .reverse()
    .map((row) => ({ key: row.month, label: monthLabel(row.month) }));

  const rows: Record<Vue, AttendanceRow[]> = {
    eleves: byStudent.map((row) => ({
      key: row.studentProfileId,
      label: row.studentName,
      href: `/admin/students/${row.studentProfileId}`,
      rate: row.rate,
      attended: row.attended,
      missed: row.missed,
      excused: row.excused,
      rated: row.rated,
    })),
    groupes: byGroup.map((row) => ({
      key: row.groupId,
      label: row.groupName,
      href: `/admin/groups/${row.groupId}?onglet=assiduite`,
      rate: row.rate,
      attended: row.attended,
      missed: row.missed,
      excused: row.excused,
      rated: row.rated,
    })),
    enseignantes: byTeacher.map((row) => ({
      key: row.staffMemberId,
      label: row.staffName,
      href: `/admin/staff/${row.staffMemberId}`,
      rate: row.rate,
      attended: row.attended,
      missed: row.missed,
      excused: row.excused,
      rated: row.rated,
    })),
    mois: byMonth.map((row) => ({
      key: row.month,
      label: monthLabel(row.month),
      href: null,
      rate: row.rate,
      attended: row.attended,
      missed: row.missed,
      excused: row.excused,
      rated: row.rated,
    })),
  };

  const query = new URLSearchParams();
  if (groupe) query.set("groupe", groupe);
  if (prof) query.set("prof", prof);
  if (mois) query.set("mois", mois);

  const tabs = [
    { key: "eleves", label: "Par élève", icon: <Users className="h-4 w-4" /> },
    { key: "groupes", label: "Par groupe", icon: <Users className="h-4 w-4" /> },
    {
      key: "enseignantes",
      label: "Par enseignante",
      icon: <UserRound className="h-4 w-4" />,
    },
    { key: "mois", label: "Par mois", icon: <CalendarClock className="h-4 w-4" /> },
  ].map((tab) => {
    const params = new URLSearchParams(query);
    params.set("vue", tab.key);
    return { ...tab, href: `/admin/attendance?${params}` };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Assiduité</h2>
        <p className="mt-1 text-muted-foreground">
          Le taux ne compte que les séances PASSÉES et non annulées. Les
          absences excusées en sont exclues : elles n&apos;ont fait perdre la
          séance à personne.
        </p>
      </div>

      <AttendanceFilters
        groups={groups}
        teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
        months={months}
        current={{ groupe: groupe ?? "", prof: prof ?? "", mois: mois ?? "" }}
      />

      {toProcess.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
              <div>
                <p className="font-medium">
                  {toProcess.length} séance{toProcess.length > 1 ? "s" : ""} à traiter
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Issue non tranchée, appel non fait, compte rendu manquant.
                  Tant qu&apos;une séance passée n&apos;est pas pointée, elle ne
                  compte pas dans le taux : ces chiffres restent incomplets.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/admin/sessions?atraiter=1" />}
            >
              Les traiter
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Indicator
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          tone="bg-success/10"
          label="Assiduité"
          value={stats.rated > 0 ? `${stats.rate} %` : "—"}
          valueClass={rateColor(stats.rate, stats.rated)}
        />
        <Indicator
          icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
          tone="bg-primary/10"
          label="Présences"
          value={String(stats.attended)}
        />
        <Indicator
          icon={<XCircle className="h-6 w-6 text-destructive" />}
          tone="bg-destructive/10"
          label="Absences"
          value={String(stats.missed)}
        />
        <Indicator
          icon={<CalendarClock className="h-6 w-6 text-muted-foreground" />}
          tone="bg-muted"
          label="Excusées"
          value={String(stats.excused)}
          note="hors taux"
        />
      </div>

      <TabLinks tabs={tabs} active={vue} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <AttendanceView
              title={
                {
                  eleves: "Par élève",
                  groupes: "Par groupe",
                  enseignantes: "Par enseignante",
                  mois: "Mois par mois",
                }[vue]
              }
              unit={
                { eleves: "Élève", groupes: "Groupe", enseignantes: "Enseignante", mois: "Mois" }[
                  vue
                ]
              }
              rows={rows[vue]}
              empty={
                {
                  eleves: "Aucune présence enregistrée sur cette période.",
                  groupes:
                    "Aucune séance de groupe pointée. Les séances hors groupe comptent dans le taux global, mais n'apparaissent pas ici.",
                  enseignantes:
                    "Aucune séance pointée n'est rattachée à une enseignante. L'enseignante se désigne sur la fiche de la séance ou du groupe.",
                  mois: "Rien à comparer pour le moment.",
                }[vue]
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Séances à traiter ({toProcess.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {toProcess.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tout est à jour.
              </p>
            ) : (
              <div className="space-y-3">
                {toProcess.slice(0, 10).map((session) => (
                  <Link
                    key={session.id}
                    href={`/admin/sessions/${session.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {session.groupName ?? session.studentName}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {formatDateTime(session.scheduledAt, timeZone)}
                      </p>
                      <Badge variant="outline" className="mt-1.5 text-xs">
                        {PENDING_REASON_LABELS[session.reason]}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs text-primary">Traiter</span>
                  </Link>
                ))}
                {toProcess.length > 10 && (
                  <Link
                    href="/admin/sessions?atraiter=1"
                    className="block pt-1 text-center text-xs text-primary hover:underline"
                  >
                    et {toProcess.length - 10} autre
                    {toProcess.length - 10 > 1 ? "s" : ""} — voir la liste
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Indicator({
  icon,
  tone,
  label,
  value,
  valueClass,
  note,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  valueClass?: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold tabular-nums ${valueClass ?? ""}`}>{value}</p>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
