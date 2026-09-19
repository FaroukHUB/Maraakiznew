import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getSessionWithFullDetails, getConsumedSessionCount } from "@/data/sessions";
import { getActiveGroupsForSelect } from "@/data/groups";
import { getStudentSkillsForProgram } from "@/data/skills";
import { getActiveStaffForSelect } from "@/data/staff";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Clock,
  Video,
  BookOpen,
  FileText,
  Users,
  Users2,
  UsersRound,
  ListChecks,
  LinkIcon,
} from "lucide-react";
import { StatusForm } from "./status-form";
import { NotesForm } from "./notes-form";
import { ResourceForm } from "./resource-form";
import { ParticipantsForm } from "./participants-form";
import { GroupForm } from "./group-form";
import { SkillsForm } from "./skills-form";
import { StaffAssignForm } from "./staff-assign-form";

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const session = await getSessionWithFullDetails(id);
  if (!session) notFound();

  const sub = session.subscription;
  const student = sub.studentProfile;
  const program = sub.program;
  const consumed = await getConsumedSessionCount(sub.id);
  const isGroup = sub.sessionType === "group";
  const activeGroups = await getActiveGroupsForSelect();
  const programSkills = await getStudentSkillsForProgram(student.id, program.id);
  const activeStaff = await getActiveStaffForSelect();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Séance {session.sessionNumber}/{sub.totalSessions}
          </h2>
          <p className="text-muted-foreground mt-1">
            {student.user.name} — {program.name}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm ${statusColors[session.status] ?? ""}`}
        >
          {SESSION_STATUS_LABELS[session.status] ?? session.status}
        </Badge>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium capitalize">
                {formatDate(session.scheduledAt)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="text-sm font-medium">{session.durationMinutes} min</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Progression forfait</p>
              <p className="text-sm font-medium">
                {consumed}/{sub.totalSessions} consommées
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {session.zoomLink && (
        <a
          href={session.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Video className="h-4 w-4" />
          Lien Zoom
        </a>
      )}

      <Separator />

      {/* Status change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusForm
            sessionId={session.id}
            currentStatus={session.status}
          />
        </CardContent>
      </Card>

      {/* Notes — visible when completed or teacher can pre-fill */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes de séance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotesForm
            sessionId={session.id}
            existingNotes={session.notes ?? undefined}
          />
        </CardContent>
      </Card>

      {/* Acquis travaillés pendant la séance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Acquis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsForm
            sessionId={session.id}
            studentProfileId={student.id}
            studentName={student.user.name}
            programName={program.name}
            skills={programSkills}
          />
        </CardContent>
      </Card>

      {/* Enseignante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Enseignante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StaffAssignForm
            sessionId={session.id}
            current={session.staffMemberId}
            staff={activeStaff}
          />
        </CardContent>
      </Card>

      {/* Groupe */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Groupe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm
            sessionId={session.id}
            currentGroup={session.group ? { id: session.group.id, name: session.group.name } : null}
            groups={activeGroups}
          />
        </CardContent>
      </Card>

      {/* Participants — only for group sessions */}
      {isGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipantsForm
              sessionId={session.id}
              subscriptionId={sub.id}
              existingParticipants={session.participants}
            />
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Ressources liées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.resources.length > 0 && (
            <div className="space-y-2">
              {session.resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/30 text-sm"
                >
                  <div>
                    <span className="font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({r.type})
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {r.visibleTo === "all" ? "Toutes" : "Participantes"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <ResourceForm sessionId={session.id} />
        </CardContent>
      </Card>
    </div>
  );
}
