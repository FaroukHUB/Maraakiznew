import { requireAdmin } from "@/lib/auth-utils";
import { getActiveStaffForSelect, getPayrollForPeriod, PAYROLL_STATUS_LABELS } from "@/data/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { PayrollPanel } from "./payroll-panel";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin();
  const { period } = await searchParams;
  const now = new Date();
  const current =
    period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [staff, entries] = await Promise.all([
    getActiveStaffForSelect(),
    getPayrollForPeriod(current),
  ]);

  const total = entries.reduce((sum, e) => sum + e.amountCents, 0);
  const unpaid = entries.filter((e) => e.status === "draft");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Paie</h2>
        <p className="text-muted-foreground mt-1">
          Le montant se calcule depuis les séances données. Un bulletin payé
          est figé : il ne se recalcule plus si le tarif change.
        </p>
      </div>

      <PayrollPanel period={current} staff={staff} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>Bulletins de {current}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {formatMoney(total)} au total · {unpaid.length} à payer
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="py-8 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun bulletin pour cette période.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.staffMember.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.sessionsCount} séance{entry.sessionsCount > 1 ? "s" : ""} ·{" "}
                      {Math.round(entry.minutesWorked / 60)} h
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
                    <PayrollPanel.StatusButton id={entry.id} status={entry.status} />
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
