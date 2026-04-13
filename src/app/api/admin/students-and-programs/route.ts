import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({}, { status: 401 });
  }

  const allStudents = await db.query.studentProfiles.findMany({
    with: { user: true },
  });

  const allPrograms = await db.query.programs.findMany({
    where: eq(programs.active, true),
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
