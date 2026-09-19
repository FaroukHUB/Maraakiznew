import { requireAdmin } from "@/lib/auth-utils";
import { NewGroupForm } from "./form";

export default async function NewGroupPage() {
  await requireAdmin();
  return <NewGroupForm />;
}
