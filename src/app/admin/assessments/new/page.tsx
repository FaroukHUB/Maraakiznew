import { requireAdmin } from "@/lib/auth-utils";
import { getActiveGroupsForSelect } from "@/data/groups";
import { NewAssessmentForm } from "./form";

export default async function NewAssessmentPage() {
  await requireAdmin();
  const groups = await getActiveGroupsForSelect();
  return <NewAssessmentForm groups={groups} />;
}
