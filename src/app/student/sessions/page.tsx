import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getActivePackForStudent } from "@/data/packs";
import { getSessionsByPackId } from "@/data/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import Link from "next/link";
import { formatLongDateTime } from "@/lib/datetime";
import { getTimezoneForStudent } from "@/data/timezones";


const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  completed: { icon: CheckCircle2, label: "Terminée", className: "text-success" },
  planned: { icon: Clock, label: "Planifiée", className: "text-primary" },
  cancelled: { icon: Circle, label: "Annulée", className: "text-muted-foreground" },
  student_absent: { icon: Circle, label: "Absente", className: "text-destructive" },
  teacher_absent: { icon: Circle, label: "Prof absente", className: "text-warning-foreground" },
};

export default async function StudentSessionsPage() {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);
  if (!student) return <p className="text-muted-foreground">Profil introuvable.</p>;

  const timeZone = await getTimezoneForStudent(student.profile.id);
  const activePack = await getActivePackForStudent(student.profile.id);
  const sessions = activePack ? await getSessionsByPackId(activePack.id) : [];
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const totalSessions = activePack?.totalSessions ?? 8;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Mes séances</h2>
        {activePack && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression du forfait</span>
              <span className="font-medium">{completedCount}/{totalSessions}</span>
            </div>
            <Progress value={(completedCount / totalSessions) * 100} className="h-2" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const config = statusConfig[session.status];
          const Icon = config.icon;
          return (
            <Link key={session.id} href={`/student/sessions/${session.id}`}>
            <Card className="hover:bg-accent/30 transition-colors">
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`mt-0.5 ${config.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">
                      Séance {session.sessionNumber}
                    </h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {formatLongDateTime(session.scheduledAt, timeZone)}
                  </p>
                  {session.status === "completed" && (
                    <p className="text-xs text-primary mt-1">
                      Voir les notes et devoirs →
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
          );
        })}
        {sessions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucune séance pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
