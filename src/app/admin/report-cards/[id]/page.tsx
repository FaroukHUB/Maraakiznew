import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getReportCardById } from "@/data/report-cards";
import { ReportCardView } from "@/components/report-card/report-card-view";
import { ArrowLeft } from "lucide-react";
import { ReportCardActions } from "./actions-panel";
import { getInstituteTimezone } from "@/data/settings";

export default async function AdminReportCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const card = await getReportCardById(id);
  if (!card) notFound();

  const timeZone = await getInstituteTimezone();

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/report-cards"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux bulletins
      </Link>

      <ReportCardActions
        id={card.id}
        status={card.status}
        generalComment={card.generalComment}
      />

      <ReportCardView
        timeZone={timeZone}
        studentName={card.studentProfile.user.name}
        card={{
          title: card.title,
          periodStart: card.periodStart,
          periodEnd: card.periodEnd,
          status: card.status,
          generalComment: card.generalComment,
          sessionsCount: card.sessionsCount,
          attendanceAttended: card.attendanceAttended,
          attendanceMissed: card.attendanceMissed,
          attendanceExcused: card.attendanceExcused,
          attendanceRate: card.attendanceRate,
          skillsAcquired: card.skillsAcquired,
          skillsTotal: card.skillsTotal,
          skillsAcquiredInPeriod: card.skillsAcquiredInPeriod,
          programProgress: card.programProgress,
          memorizedAyahs: card.memorizedAyahs,
          memorizedPortionsInPeriod: card.memorizedPortionsInPeriod,
          reviewsInPeriod: card.reviewsInPeriod,
          generatedAt: card.generatedAt,
        }}
      />
    </div>
  );
}
