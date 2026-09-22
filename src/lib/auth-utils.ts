import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * L'espace de travail est celui de l'ÉQUIPE : administration et
 * personnel enseignant. Ce que chacune y fait dépend ensuite de son
 * appartenance à l'établissement, pas de ce contrôle-ci.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin" && user.role !== "staff") {
    redirect("/login");
  }
  return user;
}

export async function requireStudent() {
  const user = await requireAuth();
  if (user.role !== "student" && user.role !== "admin") {
    redirect("/login");
  }
  return user;
}
