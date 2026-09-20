import { requireAdmin } from "@/lib/auth-utils";
import { getInstituteTimezone } from "@/data/settings";
import { NewSessionForm } from "./form";

/**
 * La page est un composant SERVEUR : elle seule peut lire le fuseau de
 * l'institut. Le formulaire, lui, est client — il a besoin d'état — et
 * reçoit le fuseau en propriété. Une page cliente ne peut pas recevoir
 * de propriété : Next ne lui passe que `params` et `searchParams`.
 */
export default async function NewSessionPage() {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  return <NewSessionForm timeZone={timeZone} />;
}
