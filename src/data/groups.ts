import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { groups, groupMembers, sessions } from "@/db/schema";
import { getAttendanceStats } from "@/data/attendance";

// ─── Admin queries ───────────────────────────────────────

/** Liste des groupes avec leurs compteurs (membres, séances, assiduité). */
export async function getAllGroupsForAdmin() {
  const rows = await db.query.groups.findMany({
    orderBy: (g, { asc }) => [asc(g.name)],
    with: {
      program: true,
      members: true,
    },
  });

  return Promise.all(
    rows.map(async (group) => {
      const [sessionCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(eq(sessions.groupId, group.id));

      return {
        ...group,
        memberCount: group.members.length,
        sessionCount: Number(sessionCount?.count ?? 0),
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
      members: {
        with: { studentProfile: { with: { user: true } } },
      },
    },
  });

  if (!group) return null;

  const groupSessions = await db.query.sessions.findMany({
    where: eq(sessions.groupId, groupId),
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    limit: 10,
    with: { participants: true },
  });

  return {
    ...group,
    sessions: groupSessions,
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
