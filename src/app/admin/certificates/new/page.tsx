import { requireAdmin } from "@/lib/auth-utils";
import { NewCertificateForm } from "./form";

export default async function NewCertificatePage() {
  await requireAdmin();
  return <NewCertificateForm />;
}
