import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getInvoicesForStudent, formatAmount } from "@/data/invoices";
import { InvoiceView } from "@/components/invoice/invoice-view";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { getViewerTimezone } from "@/data/timezones";

export default async function StudentInvoicesPage() {
  const user = await requireStudent();
  const timeZone = await getViewerTimezone(user.id);
  // getStudentByUserId renvoie l'utilisateur ; le profil est dans .profile.
  const student = await getStudentByUserId(user.id);
  const list = student ? await getInvoicesForStudent(student.profile.id) : [];

  const unpaid = list.filter((i) => i.status === "issued");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Mes factures</h2>
        <p className="text-muted-foreground mt-1">
          {unpaid.length > 0
            ? `${unpaid.length} facture${unpaid.length > 1 ? "s" : ""} en attente de règlement — ${formatAmount(
                unpaid.reduce((sum, i) => sum + i.totalCents, 0)
              )}`
            : "Toutes vos factures sont réglées."}
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucune facture</p>
          </CardContent>
        </Card>
      ) : (
        list.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="pt-6">
              <InvoiceView
                timeZone={timeZone}
                studentName=""
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
