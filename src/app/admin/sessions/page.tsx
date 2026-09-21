import { requireAdmin } from "@/lib/auth-utils";
import {
  getAllSessionsForAdmin,
  getActiveSubscriptionsForSelect,
} from "@/data/sessions";
import { getActiveStaffForSelect } from "@/data/staff";
import { getActiveGroupsForSelect } from "@/data/groups";
import { getInstituteTimezone } from "@/data/settings";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { PENDING_REASON_LABELS } from "@/data/attendance";
import { formatDateTime, formatMonth, monthKey } from "@/lib/datetime";
import { SessionDialog } from "./session-dialog";
import { SessionsList, type SessionRow } from "./sessions-list";

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ atraiter?: string }>;
}) {
  await requireAdmin();
  const { atraiter } = await searchParams;
  const [sessions, subscriptions, teachers, groups, timeZone] = await Promise.all([
    getAllSessionsForAdmin(),
    getActiveSubscriptionsForSelect(),
    getActiveStaffForSelect(),
    getActiveGroupsForSelect(),
    getInstituteTimezone(),
  ]);

  const rows: SessionRow[] = sessions.map((session) => {
    return {
      id: session.id,
      studentName: session.subscription.studentProfile.user.name,
      studentProfileId: session.subscription.studentProfile.id,
      programName: session.subscription.program.name,
      sessionNumber: session.sessionNumber,
      totalSessions: session.subscription.totalSessions,
      when: formatDateTime(session.scheduledAt, timeZone),
      monthKey: monthKey(session.scheduledAt, timeZone),
      monthLabel: formatMonth(session.scheduledAt, timeZone),
      durationMinutes: session.durationMinutes,
      status: session.status,
      statusLabel: SESSION_STATUS_LABELS[session.status] ?? session.status,
      teacher: session.staffMember
        ? { id: session.staffMember.id, name: session.staffMember.name }
        : null,
      group: session.group
        ? { id: session.group.id, name: session.group.name }
        : null,
      participantCount: session.participants.length,
      // « Passée » et « à traiter » viennent de la couche de données :
      // voir `getAllSessionsForAdmin`.
      hasNotes: session.hasNotes,
      past: session.past,
      pending: session.pending,
      pendingLabel: session.reason ? PENDING_REASON_LABELS[session.reason] : null,
    };
  });

  const upcoming = rows.filter((row) => !row.past && row.status === "planned");
  const pending = rows.filter((row) => row.pending);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Séances</h2>
          <p className="mt-1 text-muted-foreground">
            {upcoming.length} séance{upcoming.length > 1 ? "s" : ""} à venir
            {pending.length > 0 && (
              <>
                {" "}
                · {pending.length} à traiter
              </>
            )}
            {" · "}
            {rows.length} au total
          </p>
        </div>
        <SessionDialog
          timeZone={timeZone}
          subscriptions={subscriptions}
          teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
          groups={groups}
          openOnParam="planifier"
        />
      </div>

      <SessionsList rows={rows} startPending={Boolean(atraiter)} />
    </div>
  );
}
