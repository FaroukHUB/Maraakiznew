import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs, studentProfiles } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({}, { status: 401 });
  }

  const institute = await requireInstitute();

  const allStudents = await db.query.studentProfiles.findMany({
    where: eq(studentProfiles.instituteId, institute),
    with: { user: true },
  });

  const allPrograms = await db.query.programs.findMany({
    where: and(
      eq(programs.active, true),
      eq(programs.instituteId, institute)
    ),
    orderBy: (p, { asc }) => [asc(p.sortOrder)],
  });

  return NextResponse.json({
    students: allStudents.map((s) => ({
      profileId: s.id,
      name: s.user.name,
    })),
    programs: allPrograms.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      defaultSessionCount: p.defaultSessionCount,
    })),
  });
}
