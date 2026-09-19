import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/data/invoices";
import type { InvoiceLine } from "@/db/schema";

export type InvoiceData = {
  number: string | null;
  status: "draft" | "issued" | "paid" | "cancelled";
  issueDate: Date | null;
  dueDate: Date | null;
  lines: InvoiceLine[];
  totalCents: number;
  notes: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
};

const STATUS_LABELS: Record<InvoiceData["status"], string> = {
  draft: "Brouillon",
  issued: "Émise",
  paid: "Réglée",
  cancelled: "Annulée",
};

const STATUS_CLASSES: Record<InvoiceData["status"], string> = {
  draft: "text-muted-foreground",
  issued: "text-warning-foreground border-warning/30",
  paid: "text-success border-success/30",
  cancelled: "text-destructive border-destructive/30",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Rendu d'une facture, partagé entre l'admin, l'élève et l'impression. */
export function InvoiceView({
  studentName,
  invoice,
}: {
  studentName: string;
  invoice: InvoiceData;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {invoice.number ? `Facture ${invoice.number}` : "Facture (brouillon)"}
          </h1>
          <p className="text-muted-foreground mt-1">{studentName}</p>
        </div>
        <Badge variant="outline" className={STATUS_CLASSES[invoice.status]}>
          {STATUS_LABELS[invoice.status]}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <span className="text-muted-foreground">Date d&apos;émission : </span>
          {formatDate(invoice.issueDate)}
        </div>
        <div>
          <span className="text-muted-foreground">Échéance : </span>
          {formatDate(invoice.dueDate)}
        </div>
      </div>

      {/* Lignes */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Désignation</th>
              <th className="text-right font-medium px-4 py-2.5 w-20">Qté</th>
              <th className="text-right font-medium px-4 py-2.5 w-32">
                Prix unitaire
              </th>
              <th className="text-right font-medium px-4 py-2.5 w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoice.lines.map((line, index) => (
              <tr key={index}>
                <td className="px-4 py-2.5">{line.label}</td>
                <td className="px-4 py-2.5 text-right">{line.quantity}</td>
                <td className="px-4 py-2.5 text-right">
                  {formatAmount(line.unitPriceCents)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {formatAmount(line.quantity * line.unitPriceCents)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-medium">
                Total
              </td>
              <td className="px-4 py-3 text-right text-lg font-bold">
                {formatAmount(invoice.totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.status === "paid" && invoice.paidAt && (
        <p className="text-sm text-success">
          Réglée le {formatDate(invoice.paidAt)}.
        </p>
      )}

      {invoice.status === "cancelled" && (
        <p className="text-sm text-destructive">
          Annulée le {formatDate(invoice.cancelledAt)}
          {invoice.cancellationReason && ` — ${invoice.cancellationReason}`}
        </p>
      )}

      {invoice.notes && (
        <div className="text-sm">
          <p className="text-muted-foreground mb-1">Note</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
