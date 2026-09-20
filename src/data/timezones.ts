import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { getInstituteTimezone } from "@/data/settings";
import { isValidTimezone, zoneLabel } from "@/lib/timezones";

export type ZonePresence = {
  timeZone: string;
  label: string;
  /** Nombre d'élèves dans ce fuseau. */
  count: number;
  /** Les prénoms, pour l'infobulle. Tronqué à quelques noms. */
  names: string[];
};

/**
 * Les fuseaux où se trouvent réellement des élèves.
 *
 * ── Pourquoi pas une carte du monde ──
 *
 * Afficher les 24 fuseaux, ou des capitales choisies au hasard, c'est du
 * décor : l'enseignante n'a pas d'élève à Tokyo. On ne montre que les
 * fuseaux où quelqu'un l'attend, avec qui s'y trouve. Un fuseau sans
 * élève ne s'affiche pas. Ce commentaire fait foi.
 *
 * Le fuseau de l'institut est toujours en tête, même sans élève sur
 * place : c'est le repère par rapport auquel tous les autres se lisent.
 */
export async function getStudentZones(): Promise<{
  instituteZone: string;
  zones: ZonePresence[];
}> {
  const [instituteZone, profiles] = await Promise.all([
    getInstituteTimezone(),
    db.query.studentProfiles.findMany({ with: { user: true } }),
  ]);

  const byZone = new Map<string, string[]>();

  for (const profile of profiles) {
    // Un fuseau vide ou devenu invalide vaut « celui de l'institut » :
    // on ne crée pas une colonne fantôme pour une donnée manquante.
    const zone =
      profile.timezone && isValidTimezone(profile.timezone)
        ? profile.timezone
        : instituteZone;
    const firstName = (profile.user?.name ?? "").trim().split(/\s+/)[0];
    const names = byZone.get(zone) ?? [];
    if (firstName) names.push(firstName);
    byZone.set(zone, names);
  }

  byZone.set(instituteZone, byZone.get(instituteZone) ?? []);

  const zones: ZonePresence[] = [...byZone.entries()]
    .map(([timeZone, names]) => ({
      timeZone,
      label: zoneLabel(timeZone),
      count: names.length,
      names: names.slice(0, 6),
    }))
    // L'institut d'abord, puis du plus peuplé au moins peuplé.
    .sort((a, b) => {
      if (a.timeZone === instituteZone) return -1;
      if (b.timeZone === instituteZone) return 1;
      return b.count - a.count || a.label.localeCompare(b.label, "fr");
    });

  return { instituteZone, zones };
}

/**
 * Le fuseau d'une élève, ou celui de l'institut à défaut.
 *
 * Toutes les pages de l'espace élève passent par ici : une élève doit
 * voir SES heures, pas celles de l'enseignante. Un fuseau absent ou
 * devenu invalide retombe sur celui de l'institut, jamais sur celui du
 * serveur. Ce commentaire fait foi.
 */
export async function getTimezoneForStudent(
  studentProfileId: string
): Promise<string> {
  const [instituteZone, profile] = await Promise.all([
    getInstituteTimezone(),
    db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, studentProfileId),
      columns: { timezone: true },
    }),
  ]);

  return profile?.timezone && isValidTimezone(profile.timezone)
    ? profile.timezone
    : instituteZone;
}

/**
 * Le fuseau à utiliser pour CE qui regarde la page.
 *
 * Une élève voit ses heures ; toute autre personne — l'enseignante, le
 * secrétariat — voit celles de l'institut. Un compte sans profil élève
 * n'est pas une erreur : c'est le cas de l'administration.
 */
export async function getViewerTimezone(userId: string): Promise<string> {
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
    columns: { timezone: true },
  });

  if (profile?.timezone && isValidTimezone(profile.timezone)) {
    return profile.timezone;
  }
  return getInstituteTimezone();
}
