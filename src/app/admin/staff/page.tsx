import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getStaffForAdmin, getActiveStaffForSelect, STAFF_ROLE_LABELS } from "@/data/staff";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users2 } from "lucide-react";
import { StaffForm } from "./staff-form";

function formatMoney(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export default async function AdminStaffPage() {
  await requireAdmin();
  const [list, selectable] = await Promise.all([
    getStaffForAdmin(),
    getActiveStaffForSelect(),
  ]);

  const active = list.filter((m) => m.status === "active");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Ressources humaines</h2>
        <p className="text-muted-foreground mt-1">
          {active.length} membre{active.length > 1 ? "s" : ""} actif
          {active.length > 1 ? "s" : ""} sur {list.length}
        </p>
      </div>

      <StaffForm supervisors={selectable} />

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun membre</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Un membre peut exister sans compte de connexion : l&apos;institut
              suit des personnes, pas seulement des utilisatrices.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((member) => (
              <Link
                key={member.id}
                href={`/admin/staff/${member.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs">
                      {STAFF_ROLE_LABELS[member.role]}
                    </Badge>
                    {member.supervisor && (
                      <span className="text-xs text-muted-foreground">
                        supervisée par {member.supervisor.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {member.sessionsCount} séance{member.sessionsCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm">
                    {member.monthlyRateCents != null
                      ? `${formatMoney(member.monthlyRateCents)}/mois`
                      : member.hourlyRateCents != null
                        ? `${formatMoney(member.hourlyRateCents)}/h`
                        : "Non rémunérée"}
                  </span>
                  {member.status === "inactive" && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
