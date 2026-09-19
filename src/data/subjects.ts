import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { programs, subscriptions, skills } from "@/db/schema";

/** Matières avec ce qui en dépend — ce qui dit si elles sont supprimables. */
export async function getSubjectsForAdmin() {
  const list = await db.query.programs.findMany({
    orderBy: [asc(programs.sortOrder), asc(programs.name)],
  });

  return Promise.all(
    list.map(async (program) => {
      const [subs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.programId, program.id));
      const [skillCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(skills)
        .where(eq(skills.programId, program.id));

      return {
        ...program,
        subscriptionCount: Number(subs?.count ?? 0),
        skillCount: Number(skillCount?.count ?? 0),
      };
    })
  );
}
