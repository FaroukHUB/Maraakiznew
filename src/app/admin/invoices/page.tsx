import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getInvoicesForAdmin, getOutstandingTotal, formatAmount } from "@/data/invoices";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Plus } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  issued: "Émise",
  paid: "Réglée",
  cancelled: "Annulée",
};

const STATUS_CLASSES: Record<string, string> = {
  draft: "text-muted-foreground",
  issued: "text-warning-foreground border-warning/30",
  paid: "text-success border-success/30",
  cancelled: "text-destructive border-destructive/30",
};

export default async function AdminInvoicesPage() {
  await requireAdmin();
  const [list, outstanding] = await Promise.all([
    getInvoicesForAdmin(),
    getOutstandingTotal(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Factures</h2>
          <p className="text-muted-foreground mt-1">
            {outstanding.count > 0
              ? `${outstanding.count} facture${outstanding.count > 1 ? "s" : ""} en attente de règlement — ${formatAmount(outstanding.totalCents)}`
              : "Aucune facture en attente de règlement"}
          </p>
        </div>
        <Link href="/admin/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucune facture</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Une facture se prépare en brouillon, puis reçoit son numéro à
              l&apos;émission.
            </p>
            <Link href="/admin/invoices/new">
              <Button>Créer la première facture</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/admin/invoices/${invoice.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {invoice.number ?? "Brouillon"} — {invoice.studentProfile.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {invoice.subscription?.program.name ?? "Sans forfait"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold">
                    {formatAmount(invoice.totalCents)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_CLASSES[invoice.status]}`}
                  >
                    {STATUS_LABELS[invoice.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
