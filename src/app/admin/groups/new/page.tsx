import { redirect } from "next/navigation";

/**
 * La création d'un groupe se fait en MODALE, depuis la liste.
 *
 * Cette adresse existait avant la règle de la modale ; elle est gardée
 * pour que les liens déjà écrits mènent quelque part. Elle ramène à la
 * liste, d'où la modale s'ouvre. Ce commentaire fait foi.
 */
export default function NewGroupPage() {
  redirect("/admin/groups");
}
