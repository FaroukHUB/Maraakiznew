import { requireAdmin } from "@/lib/auth-utils";
import { NewReportCardForm } from "./form";

export default async function NewReportCardPage() {
  await requireAdmin();
  return <NewReportCardForm />;
}
