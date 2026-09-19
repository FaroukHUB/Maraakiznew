import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getStaffMemberById, STAFF_ROLE_LABELS, PAYROLL_STATUS_LABELS } from "@/data/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone } from "lucide-react";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export default async function StaffMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const member = await getStaffMemberById(id);
  if (!member) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux ressources humaines
      </Link>

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">{member.name}</h2>
          <Badge variant="outline">{STAFF_ROLE_LABELS[member.role]}</Badge>
          {member.status === "inactive" && (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
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
          <span>
            {member.monthlyRateCents != null
              ? `${formatMoney(member.monthlyRateCents)} / mois`
              : member.hourlyRateCents != null
                ? `${formatMoney(member.hourlyRateCents)} / heure`
                : "Non rémunérée"}
          </span>
        </div>
      </div>

      {(member.supervisor || member.supervised.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supervision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {member.supervisor && (
              <p>
                Supervisée par{" "}
                <Link
                  href={`/admin/staff/${member.supervisorId}`}
                  className="text-primary hover:underline"
                >
                  {member.supervisor.name}
                </Link>
              </p>
            )}
            {member.supervised.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1">Supervise</p>
                <ul className="space-y-1">
                  {member.supervised.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/admin/staff/${s.id}`}
                        className="text-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historique de paie ({member.payroll.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {member.payroll.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun bulletin. Ils se génèrent depuis la page Paie.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {member.payroll.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{entry.period}</p>
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
                          ? "text-success border-success/30 text-xs"
                          : "text-warning-foreground border-warning/30 text-xs"
                      }
                    >
                      {PAYROLL_STATUS_LABELS[entry.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
