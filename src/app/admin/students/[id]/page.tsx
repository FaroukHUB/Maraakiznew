import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookMarked,
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
  Globe,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  User,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getStudentFullProfile,
  getStudentGroups,
  getStudentRewards,
  getStudentNotes,
  getStudentActivity,
  getRevisionReminders,
  ageFromBirthDate,
} from "@/data/students";
import { getConsumedSessionCounts } from "@/data/sessions";
import { getStudentProgress, getStudentSkillsForProgram } from "@/data/skills";
import { getMemorizationForStudent, getMemorizedAyahCount } from "@/data/memorization";
import { getActiveGroupsForSelect } from "@/data/groups";
import { getResultsForStudent, getStudentAverage } from "@/data/assessments";
import { getDocumentsForStudent } from "@/data/documents";
import { getCertificatesForStudent } from "@/data/certificates";
import { getInstituteTimezone } from "@/data/settings";
import {
  LEVEL_LABELS,
  SESSION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PACK_STATUS_LABELS,
} from "@/lib/constants";
import {
  MERIT_KINDS,
  PENALTY_KINDS,
  REWARD_LABELS,
  starBalance,
} from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TabLinks } from "@/components/ui/tab-links";
import { formatDate, formatDateTime, formatDayMonth } from "@/lib/datetime";
import { formatAddress } from "@/lib/countries";
import { zoneLabel } from "@/lib/timezones";
import { StudentLocalTime } from "@/components/dashboard/student-local-time";
import { CloseSubscriptionButton } from "./close-subscription-button";
import { ProgressSection } from "./progress-section";
import { MemorizationSection } from "./memorization-section";
import { EditStudentButton, type StudentValues } from "../student-dialog";
import { StudentActions } from "./student-actions";
import { GroupsPanel } from "./groups-panel";
import { NotesPanel, type PrivateNote } from "./notes-panel";
import { RewardsPanel } from "./rewards-panel";

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

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const TABS = [
  "general",
  "seances",
  "coran",
  "progression",
  "forfaits",
  "evaluations",
  "documents",
] as const;
type Tab = (typeof TABS)[number];

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { onglet } = await searchParams;

  const student = await getStudentFullProfile(id);
  if (!student) notFound();

  // Un onglet inconnu dans l'adresse ramène au premier, sans erreur :
  // une adresse recopiée de travers ne doit pas casser la page.
  const tab: Tab = TABS.includes(onglet as Tab) ? (onglet as Tab) : "general";

  const [timeZone, groupsOfStudent, allGroups, rewards, notes] = await Promise.all([
    getInstituteTimezone(),
    getStudentGroups(id),
    getActiveGroupsForSelect(),
    getStudentRewards(id),
    getStudentNotes(id),
  ]);

  const user = student.user;
  const address = formatAddress(student);
  const age = ageFromBirthDate(student.birthDate);
  const stars = starBalance(rewards);
  const teachers = [
    ...new Set(groupsOfStudent.map((g) => g.teacherName).filter(Boolean)),
  ] as string[];

  const consumedBySub = new Map(
    (await getConsumedSessionCounts(student.subscriptions.map((s) => s.id))).map(
      (r) => [r.subscriptionId, r.consumed]
    )
  );
  const subsWithCounts = student.subscriptions.map((sub) => ({
    ...sub,
    consumed: consumedBySub.get(sub.id) ?? 0,
  }));
  const activeSub = subsWithCounts.find((s) => s.status === "active");

  const sessionCount = subsWithCounts.reduce(
    (total, sub) => total + sub.sessions.length,
    0
  );

  const initial: StudentValues = {
    id: student.id,
    name: user.name,
    email: user.email,
    password: "",
    birthDate: student.birthDate ?? "",
    arabicReadingLevel: student.arabicReadingLevel,
    whatsappPhone: student.whatsappPhone ?? "",
    localPhone: student.localPhone ?? "",
    paypalAddress: student.paypalAddress ?? "",
    previousExperience: student.previousExperience ?? "",
    notes: student.notes ?? "",
    address: {
      addressLine: student.addressLine ?? "",
      postalCode: student.postalCode ?? "",
      city: student.city ?? "",
      country: student.country ?? "",
      timezone: student.timezone ?? "",
    },
  };

  const privateNotes: PrivateNote[] = notes.map((note) => ({
    id: note.id,
    content: note.content,
    authorName: note.author?.name ?? null,
    writtenOn: formatDateTime(note.createdAt, timeZone),
  }));

  const tabs = [
    { key: "general", label: "Général", icon: <User className="h-4 w-4" /> },
    {
      key: "seances",
      label: "Séances",
      icon: <CalendarDays className="h-4 w-4" />,
      count: sessionCount,
    },
    { key: "coran", label: "Coran & Tajwid", icon: <BookMarked className="h-4 w-4" /> },
    { key: "progression", label: "Progression", icon: <ListChecks className="h-4 w-4" /> },
    { key: "forfaits", label: "Forfaits & paiements", icon: <CreditCard className="h-4 w-4" /> },
    { key: "evaluations", label: "Évaluations", icon: <Award className="h-4 w-4" /> },
    { key: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
  ].map((t) => ({ ...t, href: `/admin/students/${id}?onglet=${t.key}` }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Link>

      {/* ── En-tête : ce qu'on veut voir sans changer d'onglet ── */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                {user.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                {student.status === "active" ? (
                  <Badge
                    variant="outline"
                    className="border-success/30 bg-success/10 text-xs text-success"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Suspendue
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {teachers.length > 0 ? teachers.join(", ") : "Sans enseignante attitrée"}
                {" · "}
                Inscrite le {formatDate(user.createdAt, timeZone)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {groupsOfStudent.map((group) => (
                  <span
                    key={group.id}
                    className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success"
                  >
                    {group.name}
                  </span>
                ))}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {LEVEL_LABELS[student.arabicReadingLevel] ?? student.arabicReadingLevel}
                </span>
                {age !== null && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {age} ans
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-sm font-semibold tabular-nums text-warning-foreground">
                <Star className="h-3.5 w-3.5 fill-current" />
                {stars} étoile{Math.abs(stars) > 1 ? "s" : ""}
              </span>
              <div className="flex flex-wrap justify-end gap-2">
                <EditStudentButton
                  instituteZoneLabel={zoneLabel(timeZone)}
                  initial={initial}
                />
                <StudentActions
                  profileId={student.id}
                  name={user.name}
                  status={student.status}
                />
              </div>
            </div>
          </div>

          {activeSub && (
            <div className="flex items-center gap-3">
              <Progress
                value={(activeSub.consumed / activeSub.totalSessions) * 100}
                className="h-2 flex-1"
              />
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {activeSub.consumed}/{activeSub.totalSessions} séances
              </span>
            </div>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{user.email}</span>
            </div>
            {student.whatsappPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>WhatsApp : {student.whatsappPhone}</span>
              </div>
            )}
            {student.localPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Local : {student.localPhone}</span>
              </div>
            )}
            {student.paypalAddress && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">PayPal : {student.paypalAddress}</span>
              </div>
            )}
            {address && (
              <div className="flex items-start gap-2 text-sm sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm sm:col-span-2">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <StudentLocalTime
                timeZone={student.timezone ?? timeZone}
                instituteZone={timeZone}
                firstName={user.name.split(" ")[0]}
              />
            </div>
          </div>

          <Separator />

          <GroupsPanel
            profileId={student.id}
            current={groupsOfStudent.map((group) => ({
              id: group.id,
              name: group.name,
              teacherName: group.teacherName,
              schedule: group.schedule,
            }))}
            available={allGroups}
          />
        </CardContent>
      </Card>

      <TabLinks tabs={tabs} active={tab} />

      {tab === "general" && (
        <GeneralTab
          profileId={id}
          timeZone={timeZone}
          notes={privateNotes}
          rewards={rewards}
          stars={stars}
          permanentNote={student.notes}
          experience={student.previousExperience}
        />
      )}

      {tab === "seances" && (
        <SessionsTab student={student} subs={subsWithCounts} timeZone={timeZone} />
      )}

      {tab === "coran" && <QuranTab profileId={id} timeZone={timeZone} />}

      {tab === "progression" && <ProgressTab profileId={id} />}

      {tab === "forfaits" && (
        <PacksTab student={student} subs={subsWithCounts} timeZone={timeZone} />
      )}

      {tab === "evaluations" && <AssessmentsTab profileId={id} timeZone={timeZone} />}

      {tab === "documents" && <DocumentsTab profileId={id} timeZone={timeZone} />}
    </div>
  );
}

// ─── Onglet Général ──────────────────────────────────────

async function GeneralTab({
  profileId,
  timeZone,
  notes,
  rewards,
  stars,
  permanentNote,
  experience,
}: {
  profileId: string;
  timeZone: string;
  notes: PrivateNote[];
  rewards: { kind: keyof typeof REWARD_LABELS }[];
  stars: number;
  permanentNote: string | null;
  experience: string | null;
}) {
  const [activity, reminders] = await Promise.all([
    getStudentActivity(profileId),
    getRevisionReminders(profileId),
  ]);

  const countOf = (kind: keyof typeof REWARD_LABELS) =>
    rewards.filter((entry) => entry.kind === kind).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <NotesPanel profileId={profileId} notes={notes} />
          {(permanentNote || experience) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                {permanentNote && (
                  <p>
                    <span className="font-medium">Remarque permanente : </span>
                    {permanentNote}
                  </p>
                )}
                {experience && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Expérience : </span>
                    {experience}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières activités</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Rien à afficher.</p>
          ) : (
            <ul className="space-y-2.5">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 w-20 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatDayMonth(entry.at, timeZone)}
                  </span>
                  <span className="min-w-0">
                    {entry.label}
                    {entry.detail && (
                      <span className="text-muted-foreground"> — {entry.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rappels de révision</CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune portion mémorisée : les rappels naissent du cycle de
              mémorisation.
            </p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>
                    Sourate {item.surahNumber}, versets {item.ayahStart}–{item.ayahEnd}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      item.overdue
                        ? "border-destructive/30 bg-destructive/10 text-xs text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {formatDayMonth(item.nextReviewAt, timeZone)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <RewardsPanel
            profileId={profileId}
            total={stars}
            merits={MERIT_KINDS.map((kind) => ({
              kind,
              label: REWARD_LABELS[kind],
              count: countOf(kind),
            }))}
            penalties={PENALTY_KINDS.map((kind) => ({
              kind,
              label: REWARD_LABELS[kind],
              count: countOf(kind),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Onglet Séances ──────────────────────────────────────

type FullProfile = NonNullable<Awaited<ReturnType<typeof getStudentFullProfile>>>;
type SubWithCount = FullProfile["subscriptions"][number] & { consumed: number };

function SessionsTab({
  student,
  subs,
  timeZone,
}: {
  student: FullProfile;
  subs: SubWithCount[];
  timeZone: string;
}) {
  const groupParticipations = student.sessionParticipations.filter(
    (p) => p.session.subscription.studentProfileId !== student.id
  );

  return (
    <div className="space-y-6">
      {subs.length === 0 && groupParticipations.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune séance planifiée.
          </CardContent>
        </Card>
      )}

      {subs.map((sub) => (
        <Card key={sub.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {sub.program.name} —{" "}
                {sub.sessionType === "group" ? "Groupe" : "Individuel"}
              </span>
              <span className="text-sm font-normal tabular-nums text-muted-foreground">
                {sub.consumed}/{sub.totalSessions}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sub.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune séance sur ce forfait.
              </p>
            ) : (
              sub.sessions.map((sess) => (
                <Link
                  key={sess.id}
                  href={`/admin/sessions/${sess.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-accent/30"
                >
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      #{sess.sessionNumber}
                    </span>
                    <span className="truncate text-sm capitalize">
                      {formatDateTime(sess.scheduledAt, timeZone)}
                    </span>
                    {sess.notes?.stopReference && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
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
              ))
            )}
          </CardContent>
        </Card>
      ))}

      {groupParticipations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Participations en groupe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {groupParticipations.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                <span>
                  Séance de {p.session.subscription.studentProfile.user.name} —{" "}
                  <span className="capitalize">
                    {formatDateTime(p.session.scheduledAt, timeZone)}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Onglet Coran & Tajwid ───────────────────────────────

async function QuranTab({
  profileId,
  timeZone,
}: {
  profileId: string;
  timeZone: string;
}) {
  const [memorization, memorizedAyahs] = await Promise.all([
    getMemorizationForStudent(profileId),
    getMemorizedAyahCount(profileId),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookMarked className="h-4 w-4" />
          Mémorisation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MemorizationSection
          timeZone={timeZone}
          studentProfileId={profileId}
          items={memorization}
          totalAyahs={memorizedAyahs}
        />
      </CardContent>
    </Card>
  );
}

// ─── Onglet Progression ──────────────────────────────────

async function ProgressTab({ profileId }: { profileId: string }) {
  const programs = await getStudentProgress(profileId);
  const blocks = await Promise.all(
    programs.map(async (program) => ({
      ...program,
      skills: await getStudentSkillsForProgram(profileId, program.programId),
    }))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4" />
          Progression
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressSection studentProfileId={profileId} programs={blocks} />
      </CardContent>
    </Card>
  );
}

// ─── Onglet Forfaits & paiements ─────────────────────────

function PacksTab({
  student,
  subs,
  timeZone,
}: {
  student: FullProfile;
  subs: SubWithCount[];
  timeZone: string;
}) {
  const received = student.payments
    .filter((p) => p.status === "received")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const waiting = student.payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/admin/subscriptions/new?student=${student.id}`} />}
        >
          <Plus className="mr-2 h-3 w-3" />
          Nouveau forfait
        </Button>
      </div>

      {subs.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucun forfait. C&apos;est le forfait qui ouvre le droit aux séances.
          </CardContent>
        </Card>
      )}

      {subs.map((sub) => (
        <Card key={sub.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {sub.program.name} —{" "}
                {sub.sessionType === "group" ? "Groupe" : "Individuel"}
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {sub.consumed}/{sub.totalSessions} consommées
                {sub.startedAt && ` — débuté le ${formatDate(sub.startedAt, timeZone)}`}
              </span>
              {sub.closedAt && (
                <span className="text-xs text-muted-foreground">
                  Fermé le {formatDate(sub.closedAt, timeZone)}
                </span>
              )}
            </div>
            <Progress
              value={(sub.consumed / sub.totalSessions) * 100}
              className="h-2"
            />

            {sub.status === "active" && <CloseSubscriptionButton subscriptionId={sub.id} />}

            {sub.payments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Paiements
                  </h4>
                  {sub.payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span>
                        {formatPrice(pay.amountCents)} —{" "}
                        {pay.method === "paypal"
                          ? "PayPal"
                          : pay.method === "bank_transfer"
                            ? "Virement"
                            : pay.method}
                        {pay.paidAt && ` — ${formatDate(pay.paidAt, timeZone)}`}
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

      {student.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6 text-sm">
            <span>
              Reçu : <span className="font-bold">{formatPrice(received)}</span>
            </span>
            <span>
              En attente :{" "}
              <span className="font-bold text-warning-foreground">
                {formatPrice(waiting)}
              </span>
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Onglet Évaluations ──────────────────────────────────

async function AssessmentsTab({
  profileId,
  timeZone,
}: {
  profileId: string;
  timeZone: string;
}) {
  const [results, average, certificates] = await Promise.all([
    getResultsForStudent(profileId),
    getStudentAverage(profileId),
    getCertificatesForStudent(profileId),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Évaluations
            </span>
            {average !== null && (
              <span className="text-sm font-normal text-muted-foreground">
                Moyenne : {average} %
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune évaluation publiée pour cette élève.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {result.assessment.title}
                    {result.gradedAt && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {formatDate(result.gradedAt, timeZone)}
                      </span>
                    )}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
                    {result.score}/{result.assessment.maxScore} · {result.percentage} %
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diplômes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {certificates.map((certificate) => (
              <Link
                key={certificate.id}
                href={`/admin/certificates/${certificate.id}`}
                className="flex items-center justify-between gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-accent/30"
              >
                <span>
                  {certificate.program?.name ?? "Diplôme"} — {certificate.reference}
                </span>
                {certificate.issuedOn && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(new Date(certificate.issuedOn), timeZone)}
                  </span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Onglet Documents ────────────────────────────────────

async function DocumentsTab({
  profileId,
  timeZone,
}: {
  profileId: string;
  timeZone: string;
}) {
  const documents = await getDocumentsForStudent(profileId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </span>
          <Button variant="outline" size="sm" render={<Link href="/admin/documents" />}>
            Gérer
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun document suivi pour cette élève.
          </p>
        ) : (
          <ul className="space-y-2">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">{document.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {document.expiresOn
                    ? `expire le ${formatDate(new Date(document.expiresOn), timeZone)}`
                    : document.signedOn
                      ? `signé le ${formatDate(new Date(document.signedOn), timeZone)}`
                      : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
