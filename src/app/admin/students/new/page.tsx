import { redirect } from "next/navigation";

/**
 * L'inscription se fait en MODALE, depuis la liste.
 *
 * Cette adresse existait avant la règle de la modale ; elle est gardée
 * pour que les liens et les favoris déjà écrits continuent de mener
 * quelque part. Elle ne montre plus de formulaire : elle ramène à la
 * liste, d'où la modale s'ouvre. Ce commentaire fait foi.
 */
export default function NewStudentPage() {
  redirect("/admin/students");
}
