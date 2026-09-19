import { requireAdmin } from "@/lib/auth-utils";
import { getSettings } from "@/data/settings";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const current = await getSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-muted-foreground mt-1">
          L&apos;identité de l&apos;institut, telle qu&apos;elle apparaît sur
          les documents et dans le contact.
        </p>
      </div>
      <SettingsForm current={current} />
    </div>
  );
}
