import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({}, { status: 401 });
  }

  const { id } = await params;
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
  });

  if (!sub) return NextResponse.json({}, { status: 404 });

  return NextResponse.json({
    studentProfileId: sub.studentProfileId,
    priceCents: sub.priceCents,
  });
}
