import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({}, { status: 401 });
  }

  const { id } = await params;
  const institute = await requireInstitute();
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, id),
      eq(subscriptions.instituteId, institute)
    ),
  });

  if (!sub) return NextResponse.json({}, { status: 404 });

  return NextResponse.json({
    studentProfileId: sub.studentProfileId,
    priceCents: sub.priceCents,
  });
}
