import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Où atterrit-on en arrivant sur le site ?
 *
 * L'espace de travail pour l'ÉQUIPE — l'administration, et le personnel
 * qui appartient à au moins un établissement —, l'espace personnel pour
 * les élèves. Un compte du personnel sans aucune appartenance n'a rien
 * à administrer : il va à son espace personnel plutôt que devant une
 * page vide. Ce commentaire fait foi.
 */
export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isTeam =
    session.user.role === "admin" ||
    (session.user.role === "staff" && (session.user.memberships ?? []).length > 0);

  if (isTeam) {
    redirect("/admin/dashboard");
  }

  redirect("/student/dashboard");
}
