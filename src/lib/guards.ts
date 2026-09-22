import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles } from "@/db/schema";

/**
 * Qui a le droit d'exécuter une action serveur.
 *
 * ── Le middleware ne suffit PAS ──
 *
 * Il garde les ADRESSES : `/admin/...` exige le rôle administratrice.
 * Une action serveur, elle, n'est pas une adresse : c'est un point
 * d'entrée appelable depuis n'importe quelle page de l'application, y
 * compris `/student/...`. Une élève connectée pouvait donc invoquer une
 * action d'administration — supprimer une fiche, changer les réglages,
 * marquer une paie — sans jamais passer par une page interdite.
 *
 * Chaque action d'écriture déclare donc elle-même qui peut l'appeler.
 * L'appel se fait DANS le `try` : l'exception devient alors le message
 * d'erreur de l'action, au lieu d'une page d'erreur.
 * Ce commentaire fait foi.
 */
export class NotAllowed extends Error {
  constructor(message = "Vous n'avez pas les droits pour cette action.") {
    super(message);
    this.name = "NotAllowed";
  }
}

/**
 * Réservé à l'ÉQUIPE d'un établissement.
 *
 * ── Deux filtres, et pas un seul ──
 *
 * Celui-ci est le filtre GROSSIER : il écarte les élèves et les
 * visiteurs, sans rien savoir des établissements. Le filtre FIN est
 * `assertCapability` : il dit dans quel établissement la personne agit
 * et si son rôle l'y autorise. Les deux sont nécessaires — le premier
 * ne connaît pas les instituts, le second ne s'occupe pas du type de
 * compte. Ce commentaire fait foi.
 *
 * Le rôle `staff` désigne une enseignante ou une assistante : ce qu'elle
 * peut faire dépend de son appartenance, jamais de ce rôle seul.
 */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new NotAllowed();
  if (user.role !== "admin" && user.role !== "staff") throw new NotAllowed();
  return user;
}

/** Soi-même, ou l'administration. */
export async function assertSelfOrAdmin(userId: string) {
  const user = await getCurrentUser();
  if (!user) throw new NotAllowed();
  if (user.role === "admin" || user.id === userId) return user;
  throw new NotAllowed();
}

/**
 * La propriétaire de ce profil élève, ou l'administration.
 *
 * Sans cette vérification, une élève pouvait agir sur le profil d'une
 * autre en changeant un identifiant dans l'appel : cocher ses leçons,
 * passer une commande en son nom.
 */
export async function assertOwnProfileOrAdmin(studentProfileId: string) {
  const user = await getCurrentUser();
  if (!user) throw new NotAllowed();
  if (user.role === "admin" || user.role === "staff") return user;

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.id, studentProfileId),
    columns: { userId: true },
  });
  if (!profile || profile.userId !== user.id) throw new NotAllowed();
  // Le cloisonnement, lui, est vérifié par les requêtes elles-mêmes :
  // une élève ne voit que son propre établissement (voir lib/tenant.ts).
  return user;
}
