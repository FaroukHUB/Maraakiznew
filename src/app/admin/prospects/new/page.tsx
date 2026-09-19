import { requireAdmin } from "@/lib/auth-utils";
import { NewProspectForm } from "./form";

export default async function NewProspectPage() {
  await requireAdmin();
  return <NewProspectForm />;
}
