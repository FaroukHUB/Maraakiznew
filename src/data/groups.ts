import { and, asc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { groups, groupMembers, sessions } from "@/db/schema";
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
  const rows = await db.query.groups.findMany({
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
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
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
      where: eq(sessions.groupId, groupId),
      orderBy: (s, { desc }) => [desc(s.scheduledAt)],
      with: { participants: true, staffMember: { columns: { name: true } } },
    }),
    // Les séances à venir, dans l'ordre où elles arriveront : c'est ce
    // qu'on veut voir en tête de fiche, et l'inverse de l'historique.
    db.query.sessions.findMany({
      where: and(
        eq(sessions.groupId, groupId),
        gte(sessions.scheduledAt, new Date())
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
  return db.query.groups.findMany({
    where: eq(groups.status, "active"),
    orderBy: (g, { asc }) => [asc(g.name)],
    columns: { id: true, name: true },
  });
}

/** Identifiants des élèves membres d'un groupe. */
export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const rows = await db.query.groupMembers.findMany({
    where: eq(groupMembers.groupId, groupId),
    columns: { studentProfileId: true },
  });
  return rows.map((row) => row.studentProfileId);
}
