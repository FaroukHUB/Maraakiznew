import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, sessions } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json([], { status: 401 });
  }

  const institute = await requireInstitute();
  const activeSubs = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.status, "active"),
      eq(subscriptions.instituteId, institute)
    ),
    with: {
      studentProfile: { with: { user: true } },
      program: true,
      sessions: true,
    },
  });

  const result = activeSubs.map((sub) => {
    const maxNum = sub.sessions.reduce(
      (max, s) => Math.max(max, s.sessionNumber),
      0
    );
    return {
      id: sub.id,
      studentName: sub.studentProfile.user.name,
      programName: sub.program.name,
      totalSessions: sub.totalSessions,
      nextSessionNumber: maxNum + 1,
      // NULL veut dire « comme l'institut » : le formulaire s'en sert
      // pour dire à quelle heure l'élève verra la séance.
      studentTimezone: sub.studentProfile.timezone,
    };
  });

  return NextResponse.json(result);
}
