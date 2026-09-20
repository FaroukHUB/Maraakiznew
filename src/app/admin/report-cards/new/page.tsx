import { requireAdmin } from "@/lib/auth-utils";
import { getInstituteTimezone } from "@/data/settings";
import { NewReportCardForm } from "./form";

export default async function NewReportCardPage() {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  return <NewReportCardForm timeZone={timeZone} />;
}
