import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  LinkIcon,
  ListChecks,
  UserRound,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getSessionWithFullDetails,
  getConsumedSessionCount,
  getActiveSubscriptionsForSelect,
} from "@/data/sessions";
import { getActiveGroupsForSelect, getGroupMemberIds } from "@/data/groups";
import { getStudentsForAdmin } from "@/data/students";
import { getStudentSkillsForProgram } from "@/data/skills";
import { getActiveStaffForSelect } from "@/data/staff";
import { getInstituteTimezone } from "@/data/settings";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { formatFullDateTime, localInputFromInstant } from "@/lib/datetime";
import { zoneLabel } from "@/lib/timezones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { TabLinks } from "@/components/ui/tab-links";
import { StatusForm } from "./status-form";
import { NotesForm } from "./notes-form";
import { ResourceForm } from "./resource-form";
import { ParticipantsForm } from "./participants-form";
import { SkillsForm } from "./skills-form";
import { SessionActions } from "./session-actions";
import { EditSessionButton, type SessionValues } from "../session-dialog";

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};

const TABS = ["notes", "presences", "acquis", "ressources"] as const;
type Tab = (typeof TABS)[number];

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { onglet } = await searchParams;

  const session = await getSessionWithFullDetails(id);
  if (!session) notFound();

  // Un onglet inconnu dans l'adresse ramène au premier, sans erreur.
  const tab: Tab = TABS.includes(onglet as Tab) ? (onglet as Tab) : "notes";

  const sub = session.subscription;
  const student = sub.studentProfile;
  const program = sub.program;

  const [timeZone, consumed, groups, staff, skills, subscriptions, students] =
    await Promise.all([
      getInstituteTimezone(),
      getConsumedSessionCount(sub.id),
      getActiveGroupsForSelect(),
      getActiveStaffForSelect(),
      getStudentSkillsForProgram(student.id, program.id),
      getActiveSubscriptionsForSelect(),
      getStudentsForAdmin(),
    ]);

  /**
   * Qui peut être inscrite à cette séance.
   *
   * Rattachée à un groupe, ce sont SES membres — proposer tout
   * l'institut inviterait à la faute de frappe. Sans groupe, toutes les
   * élèves actives, puisque rien ne restreint la séance.
   */
  const memberIds = session.groupId
    ? await getGroupMemberIds(session.groupId)
    : null;
  const candidates = students
    .filter((row) =>
      memberIds ? memberIds.includes(row.id) : row.status === "active"
    )
    .map((row) => ({ id: row.id, name: row.name }));

  const isGroup = sub.sessionType === "group" || Boolean(session.group);
  const hasNotes = Boolean(
    session.notes && (session.notes.content || session.notes.homework)
  );

  const initial: SessionValues = {
    id: session.id,
    subscriptionId: sub.id,
    scheduledAt: localInputFromInstant(session.scheduledAt, timeZone),
    durationMinutes: String(session.durationMinutes),
    zoomLink: session.zoomLink ?? "",
    staffMemberId: session.staffMemberId ?? "",
    groupId: session.groupId ?? "",
    studentTimezone: student.timezone,
  };

  const tabs = [
    {
      key: "notes",
      label: "Compte rendu",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "presences",
      label: "Présences",
      icon: <Users className="h-4 w-4" />,
      count: session.participants.length,
    },
    { key: "acquis", label: "Acquis", icon: <ListChecks className="h-4 w-4" /> },
    {
      key: "ressources",
      label: "Ressources",
      icon: <LinkIcon className="h-4 w-4" />,
      count: session.resources.length,
    },
  ].map((t) => ({ ...t, href: `/admin/sessions/${id}?onglet=${t.key}` }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux séances
      </Link>

      {/* ── En-tête : ce qu'on veut voir sans changer d'onglet ── */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">
                  Séance {session.sessionNumber}/{sub.totalSessions}
                </h2>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[session.status] ?? ""}`}
                >
                  {SESSION_STATUS_LABELS[session.status] ?? session.status}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                <Link
                  href={`/admin/students/${student.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {student.user.name}
                </Link>{" "}
                — {program.name}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <EditSessionButton
                timeZone={timeZone}
                subscriptions={subscriptions}
                teachers={staff.map((s) => ({ id: s.id, name: s.name }))}
                groups={groups}
                initial={initial}
              />
              <SessionActions sessionId={session.id} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <p className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="capitalize">
                {formatFullDateTime(session.scheduledAt, timeZone)}
              </span>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              {session.durationMinutes} min
              <span className="text-muted-foreground">
                · heures de l&apos;institut ({zoneLabel(timeZone)})
              </span>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              {session.staffMemberId ? (
                <Link
                  href={`/admin/staff/${session.staffMemberId}`}
                  className="hover:text-primary"
                >
                  {staff.find((s) => s.id === session.staffMemberId)?.name ??
                    "Enseignante"}
                </Link>
              ) : (
                <span className="text-muted-foreground">Enseignante non assignée</span>
              )}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <UsersRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              {session.group ? (
                <Link
                  href={`/admin/groups/${session.group.id}`}
                  className="hover:text-primary"
                >
                  {session.group.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">Séance hors groupe</span>
              )}
            </p>
            {session.zoomLink && (
              <a
                href={session.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline sm:col-span-2"
              >
                <Video className="h-4 w-4 shrink-0" />
                Rejoindre la visioconférence
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Progress
              value={(consumed / sub.totalSessions) * 100}
              className="h-2 flex-1"
            />
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {consumed}/{sub.totalSessions} consommées
            </span>
          </div>

          <Separator />

          {/*
            Le statut reste dans l'EN-TÊTE, pas dans un onglet : c'est le
            geste le plus fréquent de cette page, et c'est lui qui décide
            si la séance consomme le forfait.
          */}
          <div>
            <p className="mb-2 text-sm font-medium">Statut de la séance</p>
            <StatusForm sessionId={session.id} currentStatus={session.status} />
          </div>
        </CardContent>
      </Card>

      <TabLinks tabs={tabs} active={tab} />

      {tab === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Compte rendu de séance
              </span>
              {!hasNotes && session.status === "completed" && (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-normal text-warning-foreground">
                  à remplir
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotesForm
              sessionId={session.id}
              existingNotes={session.notes ?? undefined}
            />
          </CardContent>
        </Card>
      )}

      {tab === "presences" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Présences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGroup ? (
              <ParticipantsForm
                sessionId={session.id}
                existingParticipants={session.participants}
                candidates={candidates}
                groupName={session.group?.name ?? null}
              />
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Séance individuelle : la présence de {student.user.name} est
                  portée par le <strong>statut</strong> de la séance, en haut de
                  page — « Terminée », « Élève absente », « Prof absente ».
                </p>
                <p>
                  Le pointage nominatif n&apos;apparaît ici que pour les séances
                  de groupe, où plusieurs élèves peuvent avoir des présences
                  différentes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "acquis" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4" />
              Acquis travaillés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkillsForm
              sessionId={session.id}
              studentProfileId={student.id}
              studentName={student.user.name}
              programName={program.name}
              skills={skills}
            />
          </CardContent>
        </Card>
      )}

      {tab === "ressources" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-4 w-4" />
              Ressources liées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.resources.length > 0 && (
              <ul className="space-y-2">
                {session.resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-accent/30 p-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{resource.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({resource.type})
                      </span>
                    </span>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {resource.visibleTo === "all" ? "Toutes" : "Participantes"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <ResourceForm sessionId={session.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
