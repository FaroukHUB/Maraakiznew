import { eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";

export async function getProgramById(
  programId: string
): Promise<typeof programs.$inferSelect | null> {
  const result = await db.query.programs.findFirst({
    where: eq(programs.id, programId),
  });
  return result ?? null;
}

export async function getAllPrograms(): Promise<(typeof programs.$inferSelect)[]> {
  return db.query.programs.findMany({
    where: eq(programs.active, true),
    orderBy: (p, { asc }) => [asc(p.sortOrder)],
  });
}
