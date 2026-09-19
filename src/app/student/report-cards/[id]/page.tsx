import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getReportCardById } from "@/data/report-cards";
import { ReportCardView } from "@/components/report-card/report-card-view";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "./print-button";

export default async function StudentReportCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStudent();
  const { id } = await params;
  const card = await getReportCardById(id);

  // Une élève ne voit que SES bulletins, et seulement une fois publiés.
  // Attention : getStudentByUserId renvoie l'utilisateur ; l'identifiant
  // de profil, celui que référencent les bulletins, est dans .profile.
  const student = await getStudentByUserId(user.id);
  const allowed =
    card &&
    card.status === "published" &&
    (user.role === "admin" || card.studentProfileId === student?.profile.id);
  if (!allowed) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/student/report-cards"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Mes bulletins
        </Link>
        <PrintButton />
      </div>

      <ReportCardView
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
