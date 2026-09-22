import { and, asc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { groups, groupMembers, sessions } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";
import { getAttendanceStats } from "@/data/attendance";

// ─── Admin queries ───────────────────────────────────────

/**
 * Liste des groupes avec leurs compteurs.
 *
 * ── Une requête par TABLE, pas par groupe ──
 *
 * Les comptes de séances et la prochaine séance de chaque groupe sont
 * lus d'un bloc, puis répartis en mémoire. L'assiduité, elle, reste une
 * requête par groupe : elle repose sur `getAttendanceStats`, seul point
 * d'entrée du taux, et un institut compte des dizaines de groupes, pas
 * des milliers. Ce commentaire fait foi.
 */
export async function getAllGroupsForAdmin() {
  const institute = await requireInstitute();
  const rows = await db.query.groups.findMany({
    where: eq(groups.instituteId, institute),
    orderBy: (g, { asc }) => [asc(g.name)],
    with: {
      program: true,
      staffMember: { columns: { id: true, name: true } },
      members: true,
    },
  });

  const counts = await db
    .select({
      groupId: sessions.groupId,
      total: sql<number>`count(*)`,
      next: sql<Date | null>`min(${sessions.scheduledAt}) filter (where ${sessions.scheduledAt} >= now() and ${sessions.status} = 'planned')`,
    })
    .from(sessions)
    .where(eq(sessions.instituteId, institute))
    .groupBy(sessions.groupId);

  const byGroup = new Map(
    counts
      .filter((row) => row.groupId)
      .map((row) => [row.groupId as string, row])
  );

  return Promise.all(
    rows.map(async (group) => {
      const count = byGroup.get(group.id);
      return {
        ...group,
        memberCount: group.members.length,
        sessionCount: Number(count?.total ?? 0),
        nextSessionAt: count?.next ? new Date(count.next) : null,
        attendance: await getAttendanceStats({ groupId: group.id }),
      };
    })
  );
}

/** Détail d'un groupe : membres, séances récentes, assiduité. */
export async function getGroupById(groupId: string) {
  const institute = await requireInstitute();
  const group = await db.query.groups.findFirst({
    where: and(eq(groups.id, groupId), eq(groups.instituteId, institute)),
    with: {
      program: true,
      staffMember: true,
      members: {
        with: { studentProfile: { with: { user: true } } },
      },
    },
  });

  if (!group) return null;

  const [groupSessions, upcoming] = await Promise.all([
    db.query.sessions.findMany({
      where: and(
        eq(sessions.groupId, groupId),
        eq(sessions.instituteId, institute)
      ),
      orderBy: (s, { desc }) => [desc(s.scheduledAt)],
      with: { participants: true, staffMember: { columns: { name: true } } },
    }),
    // Les séances à venir, dans l'ordre où elles arriveront : c'est ce
    // qu'on veut voir en tête de fiche, et l'inverse de l'historique.
    db.query.sessions.findMany({
      where: and(
        eq(sessions.groupId, groupId),
        gte(sessions.scheduledAt, new Date()),
        eq(sessions.instituteId, institute)
      ),
      orderBy: [asc(sessions.scheduledAt)],
      limit: 5,
    }),
  ]);

  return {
    ...group,
    sessions: groupSessions,
    upcoming,
    attendance: await getAttendanceStats({ groupId }),
  };
}

/** Groupes actifs, pour les listes déroulantes. */
export async function getActiveGroupsForSelect() {
  const institute = await requireInstitute();
  return db.query.groups.findMany({
    where: and(
      eq(groups.status, "active"),
      eq(groups.instituteId, institute)
    ),
    orderBy: (g, { asc }) => [asc(g.name)],
    columns: { id: true, name: true },
  });
}

/** Identifiants des élèves membres d'un groupe. */
export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const institute = await requireInstitute();
  const rows = await db.query.groupMembers.findMany({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.instituteId, institute)
    ),
    columns: { studentProfileId: true },
  });
  return rows.map((row) => row.studentProfileId);
}
