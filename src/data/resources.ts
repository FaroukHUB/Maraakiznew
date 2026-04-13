import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";

export async function getResourcesByProgramId(
  programId: string | null
): Promise<(typeof resources.$inferSelect)[]> {
  return db.query.resources.findMany({
    where: programId
      ? or(eq(resources.programId, programId), isNull(resources.programId))
      : undefined,
    orderBy: (r, { asc }) => [asc(r.sortOrder)],
  });
}

export async function getAllResources(): Promise<(typeof resources.$inferSelect)[]> {
  return db.query.resources.findMany({
    orderBy: (r, { asc }) => [asc(r.sortOrder)],
  });
}
