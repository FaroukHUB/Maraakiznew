import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth-utils";
import { getStudentsForAdmin } from "@/data/students";
import { getInstituteTimezone, getRegistrationToken } from "@/data/settings";
import { publicOrigin } from "@/lib/public-url";
import { zoneLabel } from "@/lib/timezones";
import { formatDate } from "@/lib/datetime";
import { PROGRAM_LABELS, LEVEL_LABELS } from "@/lib/constants";
import { StudentDialog } from "./student-dialog";
import { ImportDialog } from "./import-dialog";
import { RegistrationLinkCard } from "./registration-link-card";
import { StudentsList, type StudentListRow } from "./students-list";
import { VIEW_COOKIE_STUDENTS } from "@/lib/view-cookies";

export default async function StudentsPage() {
  await requireAdmin();
  const [students, timeZone, cookieStore, token, origin] = await Promise.all([
    getStudentsForAdmin(),
    getInstituteTimezone(),
    cookies(),
    getRegistrationToken(),
    publicOrigin(),
  ]);
  const view = cookieStore.get(VIEW_COOKIE_STUDENTS)?.value === "grid" ? "grid" : "list";

  const active = students.filter((s) => s.status === "active");

  const rows: StudentListRow[] = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    levelLabel: LEVEL_LABELS[student.level] ?? student.level,
    status: student.status,
    age: student.age,
    groups: student.groups,
    teachers: student.teachers,
    stars: student.stars,
    programLabel: student.programSlug
      ? PROGRAM_LABELS[student.programSlug] ?? student.programSlug
      : null,
    sessionsDone: student.sessionsDone,
    sessionsTotal: student.sessionsTotal,
    enrolledAt: formatDate(student.enrolledAt, timeZone),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Élèves</h2>
          <p className="mt-1 text-muted-foreground">
            {active.length} élève{active.length > 1 ? "s" : ""} dans votre institut
            {students.length > active.length && (
              <>
                {" "}
                · {students.length - active.length} suspendue
                {students.length - active.length > 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportDialog />
          <StudentDialog instituteZoneLabel={zoneLabel(timeZone)} onDone="profile" />
        </div>
      </div>

      <RegistrationLinkCard url={token ? `${origin}/inscription/${token}` : null} />

      <StudentsList rows={rows} initialView={view} />
    </div>
  );
}
