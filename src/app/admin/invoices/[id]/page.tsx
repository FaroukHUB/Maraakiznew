import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getInvoiceById } from "@/data/invoices";
import { InvoiceView } from "@/components/invoice/invoice-view";
import { ArrowLeft } from "lucide-react";
import { InvoiceActions } from "./actions-panel";

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux factures
      </Link>

      <InvoiceActions id={invoice.id} status={invoice.status} />

      <InvoiceView
        studentName={invoice.studentProfile.user.name}
        invoice={{
          number: invoice.number,
          status: invoice.status,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          lines: invoice.lines,
          totalCents: invoice.totalCents,
          notes: invoice.notes,
          paidAt: invoice.paidAt,
          cancelledAt: invoice.cancelledAt,
          cancellationReason: invoice.cancellationReason,
        }}
      />
    </div>
  );
}
