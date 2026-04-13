import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getPaymentsByStudentId } from "@/data/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    received: { label: "Reçu", className: "bg-success/15 text-success-foreground border-success/30" },
    pending: { label: "En attente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
    failed: { label: "Échoué", className: "bg-destructive/15 text-destructive border-destructive/30" },
    refunded: { label: "Remboursé", className: "bg-muted text-muted-foreground border-muted" },
  };
  const c = config[status] ?? config.pending;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function PaymentsPage() {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);
  if (!student) return <p className="text-muted-foreground">Profil introuvable.</p>;

  const payments = await getPaymentsByStudentId(student.profile.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Paiements</h2>
        <p className="text-muted-foreground mt-1">Historique de vos paiements</p>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="flex items-start sm:items-center justify-between gap-2 py-4">
              <div>
                <p className="text-sm font-medium">
                  Forfait — {formatPrice(payment.amountCents)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {payment.method === "paypal" ? "PayPal" : payment.method} —{" "}
                  {payment.paidAt
                    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(payment.paidAt)
                    : "Non payé"}
                </p>
              </div>
              <StatusBadge status={payment.status} />
            </CardContent>
          </Card>
        ))}
        {payments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun paiement enregistré.
          </p>
        )}
      </div>
    </div>
  );
}
