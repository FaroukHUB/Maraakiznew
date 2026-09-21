import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock,
  ListChecks,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import { getGroupById } from "@/data/groups";
import { getAllPrograms } from "@/data/programs";
import { getActiveStaffForSelect } from "@/data/staff";
import { getStudentsForAdmin } from "@/data/students";
import { getAttendanceByStudent } from "@/data/attendance";
import { getInstituteTimezone } from "@/data/settings";
import { LEVEL_LABELS, SESSION_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TabLinks } from "@/components/ui/tab-links";
import { EditGroupButton, type GroupValues } from "../group-dialog";
import { GroupActions } from "./group-actions";
import { MembersPanel, type Member } from "./members-panel";

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};

function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "text-muted-foreground";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

const TABS = ["general", "eleves", "seances", "assiduite"] as const;
type Tab = (typeof TABS)[number];

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { onglet } = await searchParams;

  const group = await getGroupById(id);
  if (!group) notFound();

  // Un onglet inconnu dans l'adresse ramène au premier, sans erreur.
  const tab: Tab = TABS.includes(onglet as Tab) ? (onglet as Tab) : "general";

  const [timeZone, programs, staff, students, byStudent] = await Promise.all([
    getInstituteTimezone(),
    getAllPrograms(),
    getActiveStaffForSelect(),
    getStudentsForAdmin(),
    getAttendanceByStudent({ groupId: id }),
  ]);

  const rateByStudent = new Map(
    byStudent.map((row) => [row.studentProfileId, row])
  );

  const memberIds = new Set(group.members.map((m) => m.studentProfileId));
  const members: Member[] = group.members
    .map((member) => {
      const attendance = rateByStudent.get(member.studentProfileId);
      return {
        studentProfileId: member.studentProfileId,
        name: member.studentProfile.user.name,
        levelLabel:
          LEVEL_LABELS[member.studentProfile.arabicReadingLevel] ??
          member.studentProfile.arabicReadingLevel,
        rate: attendance && attendance.rated > 0 ? attendance.rate : null,
        missed: attendance?.missed ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const available = students
    .filter((student) => !memberIds.has(student.id) && student.status === "active")
    .map((student) => ({ id: student.id, name: student.name }));

  const initial: GroupValues = {
    id: group.id,
    name: group.name,
    programId: group.programId ?? "",
    staffMemberId: group.staffMemberId ?? "",
    level: group.level ?? "",
    schedule: group.schedule ?? "",
    capacity: group.capacity != null ? String(group.capacity) : "",
    description: group.description ?? "",
    status: group.status,
  };

  const tabs = [
    { key: "general", label: "Général", icon: <ListChecks className="h-4 w-4" /> },
    {
      key: "eleves",
      label: "Élèves",
      icon: <Users className="h-4 w-4" />,
      count: members.length,
    },
    {
      key: "seances",
      label: "Séances",
      icon: <CalendarDays className="h-4 w-4" />,
      count: group.sessions.length,
    },
    { key: "assiduite", label: "Assiduité", icon: <TrendingUp className="h-4 w-4" /> },
  ].map((t) => ({ ...t, href: `/admin/groups/${id}?onglet=${t.key}` }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/groups"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux groupes
      </Link>

      {/* ── En-tête : ce qu'on veut voir sans changer d'onglet ── */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{group.name}</h2>
                {group.status === "archived" && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Archivé
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.program && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {group.program.name}
                  </span>
                )}
                {group.level && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {LEVEL_LABELS[group.level] ?? group.level}
                  </span>
                )}
              </div>
              {group.description && (
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  {group.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <EditGroupButton
                programs={programs.map((p) => ({ id: p.id, name: p.name }))}
                teachers={staff.map((s) => ({ id: s.id, name: s.name }))}
                initial={initial}
              />
              <GroupActions
                groupId={group.id}
                name={group.name}
                status={group.status}
                sessionCount={group.sessions.length}
                memberCount={group.members.length}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <p className="flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              {group.staffMember ? (
                <Link
                  href={`/admin/staff/${group.staffMember.id}`}
                  className="hover:text-primary"
                >
                  {group.staffMember.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">
                  Pas encore attribué — à définir dans « Modifier »
                </span>
              )}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              {group.schedule ?? (
                <span className="text-muted-foreground">Aucun créneau habituel</span>
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Counter
              icon={<Users className="h-5 w-5 text-primary" />}
              tone="bg-primary/10"
              label="Élèves"
              value={
                group.capacity != null
                  ? `${group.members.length}/${group.capacity}`
                  : String(group.members.length)
              }
            />
            <Counter
              icon={<CalendarDays className="h-5 w-5 text-quran" />}
              tone="bg-quran/10"
              label="Séances"
              value={String(group.sessions.length)}
            />
            <Counter
              icon={<TrendingUp className="h-5 w-5 text-success" />}
              tone="bg-success/10"
              label="Assiduité"
              value={
                group.attendance.rated > 0 ? `${group.attendance.rate} %` : "—"
              }
              valueClass={rateColor(group.attendance.rate, group.attendance.rated)}
            />
          </div>
        </CardContent>
      </Card>

      <TabLinks tabs={tabs} active={tab} />

      {tab === "general" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Prochaines séances
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/admin/sessions/new" />}
                >
                  <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                  Planifier
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune séance à venir. Une séance rattachée à ce groupe y
                  inscrit d&apos;office ses membres.
                </p>
              ) : (
                <ul className="space-y-2">
                  {group.upcoming.map((session) => (
                    <li key={session.id}>
                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-accent/30"
                      >
                        <span className="capitalize">
                          {formatDateTime(session.scheduledAt, timeZone)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColors[session.status] ?? ""}`}
                        >
                          {SESSION_STATUS_LABELS[session.status] ?? session.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Le groupe en bref</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Line label="Créé le" value={formatDate(group.createdAt, timeZone)} />
              <Line
                label="Programme"
                value={group.program?.name ?? "Aucun"}
              />
              <Line
                label="Enseignante"
                value={group.staffMember?.name ?? "Pas encore attribué"}
              />
              <Line
                label="Capacité"
                value={
                  group.capacity != null
                    ? `${group.capacity} places`
                    : "Illimitée"
                }
              />
              <Line
                label="Présences notées"
                value={
                  group.attendance.rated > 0
                    ? `${group.attendance.attended}/${group.attendance.rated}` +
                      (group.attendance.excused > 0
                        ? ` (${group.attendance.excused} excusée${group.attendance.excused > 1 ? "s" : ""})`
                        : "")
                    : "Aucune"
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "eleves" && (
        <Card>
          <CardContent className="pt-6">
            <MembersPanel
              groupId={group.id}
              capacity={group.capacity}
              members={members}
              available={available}
            />
          </CardContent>
        </Card>
      )}

      {tab === "seances" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Séances du groupe
              </span>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/admin/sessions/new" />}
              >
                <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                Planifier
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune séance rattachée à ce groupe.
              </p>
            ) : (
              <ul className="space-y-2">
                {group.sessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-accent/30"
                    >
                      <span className="text-sm capitalize">
                        {formatDateTime(session.scheduledAt, timeZone)}
                      </span>
                      <span className="flex items-center gap-3">
                        {session.staffMember && (
                          <span className="text-xs text-muted-foreground">
                            {session.staffMember.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {session.participants.length} participante
                          {session.participants.length > 1 ? "s" : ""}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColors[session.status] ?? ""}`}
                        >
                          {SESSION_STATUS_LABELS[session.status] ?? session.status}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "assiduite" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Assiduité, élève par élève
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byStudent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune présence notée sur ce groupe. Le taux n&apos;apparaît
                qu&apos;une fois les séances passées pointées — une séance à venir
                ne fait baisser personne.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  Les élèves à relancer viennent en premier.
                </p>
                <ul className="space-y-2">
                  {byStudent.map((row) => (
                    <li
                      key={row.studentProfileId}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3"
                    >
                      <Link
                        href={`/admin/students/${row.studentProfileId}`}
                        className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                      >
                        {row.studentName}
                      </Link>
                      <div className="h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, row.rate)}%` }}
                        />
                      </div>
                      <span
                        className={`w-16 shrink-0 text-right text-sm font-semibold tabular-nums ${rateColor(row.rate, row.rated)}`}
                      >
                        {row.rated > 0 ? `${row.rate} %` : "—"}
                      </span>
                      <span className="w-40 shrink-0 text-right text-xs text-muted-foreground">
                        {row.attended}/{row.rated} présences
                        {row.excused > 0 && `, ${row.excused} excusée${row.excused > 1 ? "s" : ""}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Counter({
  icon,
  tone,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold leading-tight tabular-nums ${valueClass ?? ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </p>
  );
}
