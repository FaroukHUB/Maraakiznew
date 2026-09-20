import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getStudentSessionDetail } from "@/data/sessions";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Clock,
  FileText,
  ClipboardList,
  BookOpen,
  Video,
  Presentation,
  LinkIcon,
  Headphones,
  FileDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { formatFullDateTime } from "@/lib/datetime";
import { getTimezoneForStudent } from "@/data/timezones";

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};

const resourceIcons: Record<string, typeof FileText> = {
  replay_video: Video,
  slide: Presentation,
  summary: FileDown,
  exercise: ClipboardList,
  link: LinkIcon,
};

const resourceLabels: Record<string, string> = {
  replay_video: "Replay vidéo",
  slide: "Diapo",
  summary: "Synthèse",
  exercise: "Exercice",
  link: "Lien",
};


export default async function StudentSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);
  if (!student) notFound();

  const { id } = await params;
  const timeZone = await getTimezoneForStudent(student.profile.id);
  const session = await getStudentSessionDetail(id, student.profile.id);
  if (!session) notFound();

  const program = session.subscription.program;
  const notes = session.notes;
  const total = session.subscription.totalSessions;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/student/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes séances
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Séance {session.sessionNumber}/{total}
          </h2>
          <p className="text-muted-foreground mt-1">{program.name}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm ${statusColors[session.status] ?? ""}`}
        >
          {SESSION_STATUS_LABELS[session.status] ?? session.status}
        </Badge>
      </div>

      {/* Date & duration */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span className="capitalize">{formatFullDateTime(session.scheduledAt, timeZone)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{session.durationMinutes} min</span>
        </div>
      </div>

      {/* Zoom link for planned sessions */}
      {session.status === "planned" && session.zoomLink && (
        <a
          href={session.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Video className="h-4 w-4" />
          Rejoindre sur Zoom
        </a>
      )}

      {/* Notes */}
      {notes && (notes.content || notes.homework || notes.stopReference) && (
        <>
          <Separator />

          {notes.content && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes du cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {notes.content}
                </p>
              </CardContent>
            </Card>
          )}

          {notes.stopReference && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Arrêt dans le support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground">
                  {notes.stopReference}
                </p>
              </CardContent>
            </Card>
          )}

          {notes.homework && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Devoirs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {notes.homework}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Resources */}
      {session.resources.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-base font-semibold mb-3">Ressources</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {session.resources.map((r) => {
                const Icon = resourceIcons[r.type] ?? LinkIcon;
                return (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="hover:bg-accent/30 transition-colors">
                      <CardContent className="flex items-center gap-3 py-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {resourceLabels[r.type] ?? r.type}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Group participants */}
      {session.participants.length > 1 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Participantes de cette séance
            </h3>
            <div className="flex flex-wrap gap-2">
              {session.participants.map((p) => (
                <Badge key={p.id} variant="outline" className="text-xs">
                  {p.studentProfile.user.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state for planned sessions */}
      {session.status === "planned" && !notes && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Cette séance n&apos;a pas encore eu lieu.
              Les notes et ressources seront disponibles après le cours.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
