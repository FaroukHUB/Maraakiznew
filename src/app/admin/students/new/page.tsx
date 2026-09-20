import { requireAdmin } from "@/lib/auth-utils";
import { getInstituteTimezone } from "@/data/settings";
import { zoneLabel } from "@/lib/timezones";
import { NewStudentForm } from "./form";

/**
 * Page serveur : elle lit le fuseau de l'institut, que le formulaire —
 * client — ne peut pas aller chercher lui-même.
 */
export default async function NewStudentPage() {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  return <NewStudentForm instituteZoneLabel={zoneLabel(timeZone)} />;
}
