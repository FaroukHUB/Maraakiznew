import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getStudentFullProfile } from "@/data/students";
import { getConsumedSessionCount } from "@/data/sessions";
import { getStudentProgress, getStudentSkillsForProgram } from "@/data/skills";
import {
  LEVEL_LABELS,
  SESSION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PACK_STATUS_LABELS,
} from "@/lib/constants";
import { CONSUMING_STATUSES } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { EditProfileForm } from "./edit-form";
import { CloseSubscriptionButton } from "./close-subscription-button";
import { ProgressSection } from "./progress-section";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Plus,
  Mail,
  CreditCard,
  BookOpen,
  CalendarDays,
  FileText,
  Users,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};

const paymentColors: Record<string, string> = {
  received: "bg-success/15 text-success-foreground border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-muted text-muted-foreground border-muted",
};

const packColors: Record<string, string> = {
  active: "bg-success/15 text-success-foreground border-success/30",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
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

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const student = await getStudentFullProfile(id);
  if (!student) notFound();

  const user = student.user;

  // Progression : un bloc par programme suivi, avec son référentiel
  const progressByProgram = await getStudentProgress(id);
  const progressBlocks = await Promise.all(
    progressByProgram.map(async (program) => ({
      ...program,
      skills: await getStudentSkillsForProgram(id, program.programId),
    }))
  );

  // Compute consumed counts per subscription
  const subsWithCounts = await Promise.all(
    student.subscriptions.map(async (sub) => {
      const consumed = sub.sessions.filter((s) =>
        (CONSUMING_STATUSES as readonly string[]).includes(s.status)
      ).length;
      return { ...sub, consumed };
    })
  );

  const activeSub = subsWithCounts.find((s) => s.status === "active");

  // Group participations (sessions where this student was a participant in someone else's subscription)
  const groupParticipations = student.sessionParticipations.filter(
    (p) => p.session.subscription.studentProfileId !== student.id
  );

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Élèves
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-muted-foreground mt-1">
            Inscrite le {formatDate(user.createdAt)}
          </p>
        </div>
        {activeSub && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Forfait actif</p>
            <p className="text-lg font-bold">
              {activeSub.consumed}/{activeSub.totalSessions}
            </p>
            <Progress
              value={(activeSub.consumed / activeSub.totalSessions) * 100}
              className="h-2 w-24 mt-1"
            />
          </div>
        )}
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {student.whatsappPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>WhatsApp : {student.whatsappPhone}</span>
              </div>
            )}
            {student.localPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Local : {student.localPhone}</span>
              </div>
            )}
            {student.paypalAddress && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>PayPal : {student.paypalAddress}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>Niveau : {LEVEL_LABELS[student.arabicReadingLevel] ?? student.arabicReadingLevel}</span>
            </div>
            {student.previousExperience && (
              <div className="sm:col-span-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Expérience : </span>
                {student.previousExperience}
              </div>
            )}
            {student.notes && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-accent/30 text-sm">
                <span className="font-medium">Notes admin : </span>
                {student.notes}
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <EditProfileForm
            data={{
              profileId: student.id,
              name: user.name,
              email: user.email,
              whatsappPhone: student.whatsappPhone,
              localPhone: student.localPhone,
              paypalAddress: student.paypalAddress,
              arabicReadingLevel: student.arabicReadingLevel,
              previousExperience: student.previousExperience,
              notes: student.notes,
            }}
          />
        </CardContent>
      </Card>

      {/* New subscription button */}
      <div className="flex justify-end">
        <Link href={`/admin/subscriptions/new?student=${student.id}`}>
          <Button variant="outline" size="sm">
            <Plus className="h-3 w-3 mr-2" />
            Nouveau forfait
          </Button>
        </Link>
      </div>

      {/* Subscriptions */}
      {subsWithCounts.map((sub) => (
        <Card key={sub.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {sub.program.name} — {sub.sessionType === "group" ? "Groupe" : "Individuel"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-muted-foreground">
                  {formatPrice(sub.priceCents)}
                </span>
                <Badge variant="outline" className={packColors[sub.status] ?? ""}>
                  {PACK_STATUS_LABELS[sub.status] ?? sub.status}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progression : {sub.consumed}/{sub.totalSessions} consommées
                {sub.startedAt && ` — débuté le ${formatDate(sub.startedAt)}`}
              </span>
              {sub.closedAt && (
                <span className="text-xs text-muted-foreground">
                  Fermé le {formatDate(sub.closedAt)}
                </span>
              )}
            </div>
            <Progress
              value={(sub.consumed / sub.totalSessions) * 100}
              className="h-2"
            />

            {sub.status === "active" && (
              <CloseSubscriptionButton subscriptionId={sub.id} />
            )}

            {/* Sessions timeline */}
            <div className="space-y-2">
              {sub.sessions.map((sess) => (
                <Link
                  key={sess.id}
                  href={`/admin/sessions/${sess.id}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      #{sess.sessionNumber}
                    </span>
                    <span className="text-sm capitalize truncate">
                      {formatDateTime(sess.scheduledAt)}
                    </span>
                    {sess.notes && sess.notes.stopReference && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        — {sess.notes.stopReference}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusColors[sess.status] ?? ""}`}
                  >
                    {SESSION_STATUS_LABELS[sess.status] ?? sess.status}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Payments for this subscription */}
            {sub.payments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Paiements
                  </h4>
                  {sub.payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span>
                        {formatPrice(pay.amountCents)} —{" "}
                        {pay.method === "paypal" ? "PayPal" : pay.method === "bank_transfer" ? "Virement" : pay.method}
                        {pay.paidAt && ` — ${formatDate(pay.paidAt)}`}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${paymentColors[pay.status] ?? ""}`}
                      >
                        {PAYMENT_STATUS_LABELS[pay.status] ?? pay.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Progression pédagogique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressSection studentProfileId={id} programs={progressBlocks} />
        </CardContent>
      </Card>

      {/* Group participations */}
      {groupParticipations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participations en groupe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupParticipations.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span>
                    Séance de{" "}
                    {p.session.subscription.studentProfile.user.name} —{" "}
                    <span className="capitalize">
                      {formatDateTime(p.session.scheduledAt)}
                    </span>
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {p.attendanceStatus === "present"
                      ? "Présente"
                      : p.attendanceStatus === "absent"
                      ? "Absente"
                      : p.attendanceStatus === "late"
                      ? "En retard"
                      : "Excusée"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total payments summary */}
      {student.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Historique paiements complet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm mb-3">
              <span>
                Total reçu :{" "}
                <span className="font-bold">
                  {formatPrice(
                    student.payments
                      .filter((p) => p.status === "received")
                      .reduce((sum, p) => sum + p.amountCents, 0)
                  )}
                </span>
              </span>
              <span>
                En attente :{" "}
                <span className="font-bold text-warning-foreground">
                  {formatPrice(
                    student.payments
                      .filter((p) => p.status === "pending")
                      .reduce((sum, p) => sum + p.amountCents, 0)
                  )}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
