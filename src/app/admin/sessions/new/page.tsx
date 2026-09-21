import { redirect } from "next/navigation";

/**
 * La planification se fait en MODALE, depuis la liste des séances.
 *
 * Cette adresse est gardée pour les liens déjà écrits : elle ramène à la
 * liste, d'où la modale s'ouvre. Ce commentaire fait foi.
 */
export default function NewSessionPage() {
  redirect("/admin/sessions");
}
