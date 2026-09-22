import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  studentProfiles,
  instituteMembers,
  institutes,
  capabilitiesOf,
  type Capability,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-utils";
import { NotAllowed } from "@/lib/guards";

/**
 * L'ÉTABLISSEMENT ACTIF : le point d'entrée unique du cloisonnement.
 *
 * ── La règle ──
 *
 * Toute lecture et toute écriture de données métier est filtrée par
 * l'établissement rendu ici. Pas « la plupart » : toutes. Une requête
 * qui l'oublie laisse fuir les données d'un institut chez un autre, et
 * cet oubli ne se voit ni à l'écran, ni au typage, ni à l'essai — tant
 * qu'il n'y a qu'un seul institut dans la base.
 *
 * C'est pourquoi le filtrage ne s'écrit pas à la main dans chaque
 * requête : il passe par `requireInstitute()`, et le script
 * `scripts/check-tenant-scope.ts` refuse tout fichier de données qui ne
 * l'appelle pas. Ce commentaire fait foi.
 *
 * ── D'où vient l'établissement ──
 *
 *   • élève   → celui de son profil, et lui seul ;
 *   • membre  → celui du cookie s'il est membre de plusieurs, sinon le
 *               sien ;
 *   • admin historique sans appartenance → l'établissement d'origine
 *               n'est PAS supposé : sans appartenance, on refuse. La
 *               migration a créé l'appartenance de chaque admin.
 *
 * ── Et le public ──
 *
 * Une page publique n'a pas de session : elle ne passe jamais par ici.
 * Elle résout son établissement par un identifiant explicite (jeton
 * d'inscription, adresse) et le transmet en paramètre.
 */

/** Le cookie qui retient l'établissement choisi, pour qui en a plusieurs. */
export const INSTITUTE_COOKIE = "maraakiz-institut";

export type ActiveInstitute = {
  id: string;
  capabilities: Capability[];
  /** Rôle dans CET établissement, ou null pour une élève. */
  role: "owner" | "manager" | "teacher" | "assistant" | null;
};

/**
 * L'établissement actif de la personne connectée, ou null.
 *
 * Mémoïsé par requête : une page qui appelle vingt fonctions de données
 * ne relit pas vingt fois la session ni la base.
 */
export const getActiveInstitute = cache(
  async (): Promise<ActiveInstitute | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    if (user.role === "student") {
      const profile = await db.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, user.id),
        columns: { instituteId: true },
      });
      if (!profile) return null;
      // Une élève n'a aucune capacité de gestion : elle n'est pas
      // membre de l'équipe, elle est inscrite.
      return { id: profile.instituteId, capabilities: [], role: null };
    }

    const memberships = await db.query.instituteMembers.findMany({
      where: and(
        eq(instituteMembers.userId, user.id),
        eq(instituteMembers.status, "active")
      ),
    });
    if (memberships.length === 0) return null;

    let chosen = memberships[0];
    if (memberships.length > 1) {
      const wanted = (await cookies()).get(INSTITUTE_COOKIE)?.value;
      // Un cookie ne donne JAMAIS accès : il ne fait que choisir parmi
      // les appartenances déjà vérifiées en base.
      chosen = memberships.find((m) => m.instituteId === wanted) ?? memberships[0];
    }

    return {
      id: chosen.instituteId,
      capabilities: capabilitiesOf(chosen),
      role: chosen.role,
    };
  }
);

/**
 * L'identifiant de l'établissement actif, ou un refus.
 *
 * C'est la fonction qu'appelle chaque requête de la couche de données.
 */
export async function requireInstitute(): Promise<string> {
  const active = await getActiveInstitute();
  if (!active) {
    throw new NotAllowed("Aucun établissement n'est associé à ce compte.");
  }
  return active.id;
}

/**
 * Exige une capacité DANS l'établissement actif.
 *
 * Le jeton a pu ouvrir la porte ; ici on relit les appartenances en
 * base. Une personne dont les droits viennent d'être retirés est
 * refusée sans attendre sa reconnexion.
 */
export async function assertCapability(capability: Capability): Promise<string> {
  const active = await getActiveInstitute();
  if (!active) {
    throw new NotAllowed("Aucun établissement n'est associé à ce compte.");
  }
  if (!active.capabilities.includes(capability)) {
    throw new NotAllowed(
      "Votre rôle dans cet établissement ne permet pas cette action."
    );
  }
  return active.id;
}

/** Tous les établissements de la personne connectée, pour le sélecteur. */
export async function getMyInstitutes(): Promise<
  { id: string; name: string; role: string }[]
> {
  const user = await getCurrentUser();
  if (!user || user.role === "student") return [];

  const rows = await db
    .select({
      id: institutes.id,
      name: institutes.name,
      role: instituteMembers.role,
    })
    .from(instituteMembers)
    .innerJoin(institutes, eq(institutes.id, instituteMembers.instituteId))
    .where(
      and(
        eq(instituteMembers.userId, user.id),
        eq(instituteMembers.status, "active")
      )
    );

  return rows;
}

/**
 * L'élève désignée appartient-elle à cet établissement ?
 *
 * ── Pourquoi ce contrôle en plus du filtrage ──
 *
 * Une action qui INSÈRE — une note, une étoile — ne relit pas l'élève :
 * elle écrit une ligne chez elle, en recopiant l'identifiant reçu du
 * navigateur. Rien ne fuit, mais la ligne se rattache à l'élève d'un
 * autre institut, et personne ne le voit.
 *
 * La base le refuse désormais d'elle-même (clés étrangères composées,
 * migration 0011) : c'est la garantie de fond, celle qui tient pour
 * tous les chemins d'écriture, y compris ceux qu'on n'a pas encore
 * écrits. Ce contrôle-ci ne la remplace pas — il donne un refus lisible
 * plutôt qu'une erreur de base de données. Ce commentaire fait foi.
 */
export async function assertStudentInInstitute(
  studentProfileId: string
): Promise<string> {
  const institute = await requireInstitute();
  const profile = await db.query.studentProfiles.findFirst({
    where: and(
      eq(studentProfiles.id, studentProfileId),
      eq(studentProfiles.instituteId, institute)
    ),
    columns: { id: true },
  });
  if (!profile) {
    throw new NotAllowed("Cette élève n'appartient pas à votre établissement.");
  }
  return institute;
}

/**
 * Vérifie qu'une ressource appartient bien à l'établissement actif.
 *
 * À appeler après avoir lu une ligne par son identifiant : un
 * identifiant deviné ou recopié d'un autre institut doit se heurter à
 * un mur, pas révéler son contenu.
 */
export async function assertOwnedByInstitute(
  row: { instituteId: string } | null | undefined
): Promise<void> {
  const active = await requireInstitute();
  if (!row || row.instituteId !== active) {
    throw new NotAllowed("Cette donnée n'appartient pas à votre établissement.");
  }
}
