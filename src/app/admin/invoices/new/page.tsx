import { requireAdmin } from "@/lib/auth-utils";
import { NewInvoiceForm } from "./form";

export default async function NewInvoicePage() {
  await requireAdmin();
  return <NewInvoiceForm />;
}
