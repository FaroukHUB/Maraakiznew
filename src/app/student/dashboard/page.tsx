import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getActivePackForStudent } from "@/data/packs";
import { getSessionsByPackId, getLastCompletedSession, getConsumedSessionCount } from "@/data/sessions";
import { getLatestPaymentForStudent } from "@/data/payments";
import { getProgramById } from "@/data/programs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  Library,
  Newspaper,
  FileText,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    received: { label: "Actif", className: "bg-success/15 text-success-foreground border-success/30" },
    pending: { label: "En attente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
    failed: { label: "A renouveler", className: "bg-destructive/15 text-destructive border-destructive/30" },
    refunded: { label: "Remboursé", className: "bg-muted text-muted-foreground border-muted" },
  };
  const c = config[status] ?? config.pending;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default async function StudentDashboard() {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profil élève introuvable.</p>
      </div>
    );
  }

  const activePack = await getActivePackForStudent(student.profile.id);
  const program = activePack ? await getProgramById(activePack.programId) : null;
  const completedCount = activePack
    ? await getConsumedSessionCount(activePack.id)
    : 0;
  const totalSessions = activePack?.totalSessions ?? 8;
  const progressPercent = (completedCount / totalSessions) * 100;

  const sessionList = activePack
    ? await getSessionsByPackId(activePack.id)
    : [];
  const nextSession = sessionList.find((s) => s.status === "planned");
  const lastSession = activePack
    ? await getLastCompletedSession(activePack.id)
    : null;
  const lastNotes = lastSession?.notes ?? null;
  const latestPayment = await getLatestPaymentForStudent(student.profile.id);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Bienvenue, {student.name.split(" ")[0]}
        </h2>
        {program && (
          <p className="text-muted-foreground mt-1">
            Parcours{" "}
            <span className="font-medium text-foreground">
              {program.name}
            </span>
          </p>
        )}
      </div>

      {/* Main cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pack progress */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Mon forfait
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activePack ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-foreground">
                    {completedCount}/{totalSessions}
                  </span>
                  <span className="text-sm text-muted-foreground">séances</span>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {activePack.sessionType === "group" ? "Groupe" : "Individuel"} — {activePack.weeklyRhythm}x/sem
                  </span>
                  <span className="font-medium">
                    {formatPrice(activePack.priceCents)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun forfait actif
              </p>
            )}
          </CardContent>
        </Card>

        {/* Next session */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Prochaine séance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextSession ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Séance {nextSession.sessionNumber}/{totalSessions}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {formatDate(nextSession.scheduledAt)}
                </p>
                {nextSession.zoomLink && (
                  <a
                    href={nextSession.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline mt-1"
                  >
                    Rejoindre sur Zoom
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pas de séance planifiée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <PaymentStatusBadge
                status={latestPayment?.status ?? "pending"}
              />
              {latestPayment?.paidAt && (
                <p className="text-xs text-muted-foreground">
                  Dernier paiement le{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(latestPayment.paidAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last session notes */}
      {lastSession && lastNotes && (lastNotes.content || lastNotes.homework) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dernière séance — Séance {lastSession.sessionNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastNotes.content && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Notes du cours
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lastNotes.content}
                </p>
              </div>
            )}
            {lastNotes.stopReference && (
              <p className="text-xs text-muted-foreground italic">
                Arrêt : {lastNotes.stopReference}
              </p>
            )}
            {lastNotes.homework && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Devoirs
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lastNotes.homework}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick access */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Accès rapide
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Mes séances", href: "/student/sessions", icon: BookOpen },
            { label: "Ressources", href: "/student/resources", icon: Library },
            { label: "Paiements", href: "/student/payments", icon: CreditCard },
            { label: "Blog & Conseils", href: "/student/blog", icon: Newspaper },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
