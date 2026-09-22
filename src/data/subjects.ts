import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { programs, subscriptions, skills } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

/** Matières avec ce qui en dépend — ce qui dit si elles sont supprimables. */
export async function getSubjectsForAdmin() {
  const institute = await requireInstitute();
  const list = await db.query.programs.findMany({
    where: eq(programs.instituteId, institute),
    orderBy: [asc(programs.sortOrder), asc(programs.name)],
  });

  return Promise.all(
    list.map(async (program) => {
      const [subs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(and(eq(subscriptions.programId, program.id), eq(subscriptions.instituteId, institute)));
      const [skillCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(skills)
        .where(and(eq(skills.programId, program.id), eq(skills.instituteId, institute)));

      return {
        ...program,
        subscriptionCount: Number(subs?.count ?? 0),
        skillCount: Number(skillCount?.count ?? 0),
      };
    })
  );
}
