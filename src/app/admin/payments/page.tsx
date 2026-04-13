import { requireAdmin } from "@/lib/auth-utils";
import { getAllPaymentsForAdmin } from "@/data/payments";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PaymentStatusButton } from "./payment-status-button";
import { SearchFilter, StatusFilter } from "@/components/admin/search-filter";
import { FiltersWrapper } from "@/components/admin/filters-wrapper";

const statusColors: Record<string, string> = {
  received: "bg-success/15 text-success-foreground border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-muted text-muted-foreground border-muted",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; method?: string }>;
}) {
  await requireAdmin();
  const { q, status: filterStatus, method } = await searchParams;
  let allPayments = await getAllPaymentsForAdmin();

  if (q) {
    const search = q.toLowerCase();
    allPayments = allPayments.filter(
      (p) => p.studentProfile.user.name.toLowerCase().includes(search)
    );
  }
  if (filterStatus) {
    allPayments = allPayments.filter((p) => p.status === filterStatus);
  }
  if (method) {
    allPayments = allPayments.filter((p) => p.method === method);
  }

  const totalReceived = allPayments
    .filter((p) => p.status === "received")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const totalPending = allPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Paiements</h2>
          <p className="text-muted-foreground mt-1">
            {allPayments.length} paiement{allPayments.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/payments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Enregistrer un paiement
          </Button>
        </Link>
      </div>

      <FiltersWrapper>
        <SearchFilter placeholder="Rechercher une élève..." />
        <StatusFilter
          paramName="status"
          options={[
            { value: "received", label: "Reçu" },
            { value: "pending", label: "En attente" },
            { value: "failed", label: "Échoué" },
            { value: "refunded", label: "Remboursé" },
          ]}
        />
        <StatusFilter
          paramName="method"
          options={[
            { value: "paypal", label: "PayPal" },
            { value: "bank_transfer", label: "Virement" },
            { value: "cash", label: "Espèces" },
            { value: "other", label: "Autre" },
          ]}
        />
      </FiltersWrapper>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total reçu</p>
            <p className="text-2xl font-bold text-success-foreground">
              {formatPrice(totalReceived)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-warning-foreground">
              {formatPrice(totalPending)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link href={`/admin/students/${payment.studentProfileId}`} className="text-sm font-medium hover:text-primary transition-colors">{payment.studentProfile.user.name}</Link>
                  </TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{payment.subscription.program.name}</span></TableCell>
                  <TableCell><span className="text-sm font-medium">{formatPrice(payment.amountCents)}</span></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{payment.method === "paypal" ? "PayPal" : payment.method === "bank_transfer" ? "Virement" : payment.method === "cash" ? "Espèces" : "Autre"}</span></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground truncate max-w-[120px] block">{payment.externalReference ?? "—"}</span></TableCell>
                  <TableCell><Badge variant="outline" className={statusColors[payment.status] ?? ""}>{PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}</Badge></TableCell>
                  <TableCell>{payment.status === "pending" && <PaymentStatusButton paymentId={payment.id} targetStatus="received" label="Marquer reçu" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {allPayments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <Link href={`/admin/students/${payment.studentProfileId}`} className="text-sm font-medium hover:text-primary transition-colors truncate">{payment.studentProfile.user.name}</Link>
                <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${statusColors[payment.status] ?? ""}`}>{PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{payment.subscription.program.name}</span>
                <span className="font-medium text-foreground">{formatPrice(payment.amountCents)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{payment.method === "paypal" ? "PayPal" : payment.method === "bank_transfer" ? "Virement" : payment.method === "cash" ? "Espèces" : "Autre"} — {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}</span>
                {payment.status === "pending" && <PaymentStatusButton paymentId={payment.id} targetStatus="received" label="Marquer reçu" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
