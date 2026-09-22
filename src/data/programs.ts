import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function getProgramById(
  programId: string
): Promise<typeof programs.$inferSelect | null> {
  const institute = await requireInstitute();
  const result = await db.query.programs.findFirst({
    where: and(eq(programs.id, programId), eq(programs.instituteId, institute)),
  });
  return result ?? null;
}

export async function getAllPrograms(): Promise<(typeof programs.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.programs.findMany({
    where: and(eq(programs.active, true), eq(programs.instituteId, institute)),
    orderBy: (p, { asc }) => [asc(p.sortOrder)],
  });
}
