import { and, eq, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function getResourcesByProgramId(
  programId: string | null
): Promise<(typeof resources.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.resources.findMany({
    where: and(
      eq(resources.instituteId, institute),
      programId
        ? or(eq(resources.programId, programId), isNull(resources.programId))
        : undefined
    ),
    orderBy: (r, { asc }) => [asc(r.sortOrder)],
  });
}

export async function getAllResources(): Promise<(typeof resources.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.resources.findMany({
    where: eq(resources.instituteId, institute),
    orderBy: (r, { asc }) => [asc(r.sortOrder)],
  });
}
