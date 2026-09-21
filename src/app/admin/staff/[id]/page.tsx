import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  Phone,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getStaffMemberById,
  getActiveStaffForSelect,
  getStaffNotebook,
  getStaffStudents,
  getStaffReach,
  STAFF_ROLE_LABELS,
  PAYROLL_STATUS_LABELS,
} from "@/data/staff";
import { getInstituteTimezone } from "@/data/settings";
import { formatDateTime, formatDayMonthYear, formatMonth } from "@/lib/datetime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TabLinks } from "@/components/ui/tab-links";
import { EditStaffButton, type StaffValues } from "../staff-dialog";

function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const TABS = ["informations", "paie", "cahiers", "eleves"] as const;
type Tab = (typeof TABS)[number];

export default async function StaffMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { onglet } = await searchParams;

  const member = await getStaffMemberById(id);
  if (!member) notFound();

  // Un onglet inconnu dans l'adresse ramène au premier, sans erreur :
  // une adresse recopiée de travers ne doit pas casser la page.
  const tab: Tab = TABS.includes(onglet as Tab) ? (onglet as Tab) : "informations";

  const [timeZone, supervisors, reach, notebook, students] = await Promise.all([
    getInstituteTimezone(),
    getActiveStaffForSelect(),
    getStaffReach(id),
    getStaffNotebook(id),
    getStaffStudents(id),
  ]);

  const initial: StaffValues = {
    id: member.id,
    name: member.name,
    role: member.role,
    email: member.email ?? "",
    phone: member.phone ?? "",
    status: member.status,
    mode:
      member.monthlyRateCents != null
        ? "monthly"
        : member.hourlyRateCents != null
          ? "hourly"
          : "none",
    rate:
      member.monthlyRateCents != null
        ? String(member.monthlyRateCents / 100)
        : member.hourlyRateCents != null
          ? String(member.hourlyRateCents / 100)
          : "",
    supervisorId: member.supervisorId ?? "",
    notes: member.notes ?? "",
  };

  const href = (key: Tab) => `/admin/staff/${id}?onglet=${key}`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux professeurs
      </Link>

      {/* En-tête */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
              {member.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{member.name}</h2>
              <Badge variant="outline">{STAFF_ROLE_LABELS[member.role]}</Badge>
              <Badge
                variant="outline"
                className={
                  member.status === "active"
                    ? "border-success/30 text-success"
                    : "text-muted-foreground"
                }
              >
                {member.status === "active" ? "Actif" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {member.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {member.email}
                </span>
              )}
              {member.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {member.phone}
                </span>
              )}
            </div>
          </div>
          <EditStaffButton supervisors={supervisors} initial={initial} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TabLinks
            active={tab}
            className="px-2 pt-2"
            tabs={[
              { key: "informations", label: "Informations", href: href("informations"), icon: <User className="h-4 w-4" /> },
              { key: "paie", label: "Historique & paie", href: href("paie"), icon: <Wallet className="h-4 w-4" />, count: member.payroll.length },
              { key: "cahiers", label: "Cahiers de textes", href: href("cahiers"), icon: <BookOpen className="h-4 w-4" />, count: notebook.length },
              { key: "eleves", label: "Élèves", href: href("eleves"), icon: <Users className="h-4 w-4" />, count: students.length },
            ]}
          />

          <div className="p-5 sm:p-6">
            {tab === "informations" && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Rémunération">
                    {member.monthlyRateCents != null
                      ? `${formatMoney(member.monthlyRateCents)} par mois`
                      : member.hourlyRateCents != null
                        ? `${formatMoney(member.hourlyRateCents)} par heure`
                        : "Non rémunérée"}
                  </Field>
                  <Field label="Supervisée par">
                    {member.supervisor?.name ?? "Personne"}
                  </Field>
                  <Field label="Arrivée">
                    {member.hiredOn ? formatDayMonthYear(member.hiredOn, timeZone) : "—"}
                  </Field>
                  <Field label="Dernière connexion">
                    {member.user?.lastSignInAt
                      ? formatDateTime(member.user.lastSignInAt, timeZone)
                      : "Jamais connectée"}
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric value={reach.studentsCount} label="élèves suivies" />
                  <Metric value={reach.groupsCount} label="groupes tenus" />
                  <Metric value={reach.sessionsCount} label="séances données" />
                </div>

                {member.supervised.length > 0 && (
                  <Field label="Supervise">
                    {member.supervised.map((person) => person.name).join(", ")}
                  </Field>
                )}

                {member.notes && (
                  <div className="rounded-xl bg-accent/30 p-3 text-sm">
                    <span className="font-medium">Notes internes : </span>
                    {member.notes}
                  </div>
                )}
              </div>
            )}

            {tab === "paie" && (
              member.payroll.length === 0 ? (
                <Empty>
                  Aucun bulletin. Ils se calculent depuis{" "}
                  <Link href="/admin/payroll" className="text-primary hover:underline">
                    l&apos;écran Paie
                  </Link>
                  .
                </Empty>
              ) : (
                <ul className="divide-y divide-border">
                  {member.payroll.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium first-letter:uppercase">
                          {formatMonth(new Date(`${entry.period}-01T12:00:00Z`), timeZone)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.sessionsCount} séance{entry.sessionsCount > 1 ? "s" : ""} ·{" "}
                          {Math.round(entry.minutesWorked / 60)} h
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {formatMoney(entry.amountCents)}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            entry.status === "paid"
                              ? "border-success/30 text-xs text-success"
                              : "border-warning/30 text-xs text-warning-foreground"
                          }
                        >
                          {PAYROLL_STATUS_LABELS[entry.status]}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {tab === "cahiers" && (
              notebook.length === 0 ? (
                <Empty>
                  Aucune note de séance. Le cahier de textes se remplit depuis
                  la fiche d&apos;une séance.
                </Empty>
              ) : (
                <ul className="space-y-3">
                  {notebook.map((session) => {
                    const who =
                      session.group?.name ??
                      session.subscription?.studentProfile?.user?.name ??
                      "Séance";
                    return (
                      <li key={session.id}>
                        <Link
                          href={`/admin/sessions/${session.id}`}
                          className="block rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-accent/20"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-medium">{who}</p>
                            <p className="text-xs text-muted-foreground first-letter:uppercase">
                              {formatDateTime(session.scheduledAt, timeZone)}
                            </p>
                          </div>
                          {session.notes?.content && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {session.notes.content}
                            </p>
                          )}
                          {session.notes?.stopReference && (
                            <p className="mt-1 text-xs text-primary">
                              Arrêt : {session.notes.stopReference}
                            </p>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {tab === "eleves" && (
              students.length === 0 ? (
                <Empty>
                  Aucune élève. Elles arrivent par un groupe attribué ou par
                  des séances particulières.
                </Empty>
              ) : (
                <ul className="divide-y divide-border">
                  {students.map((student) => (
                    <li key={student.id}>
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
                      >
                        <span className="text-sm font-medium">{student.name}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {student.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                            >
                              {reason}
                            </span>
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{children}</p>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
