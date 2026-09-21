import { requireAdmin } from "@/lib/auth-utils";
import { getAllGroupsForAdmin } from "@/data/groups";
import { getAllPrograms } from "@/data/programs";
import { getActiveStaffForSelect } from "@/data/staff";
import { getInstituteTimezone } from "@/data/settings";
import { formatDayMonth } from "@/lib/datetime";
import { LEVEL_LABELS } from "@/lib/constants";
import { GroupDialog } from "./group-dialog";
import { GroupsList, type GroupRow } from "./groups-list";

export default async function AdminGroupsPage() {
  await requireAdmin();
  const [groups, programs, staff, timeZone] = await Promise.all([
    getAllGroupsForAdmin(),
    getAllPrograms(),
    getActiveStaffForSelect(),
    getInstituteTimezone(),
  ]);

  const active = groups.filter((group) => group.status === "active");
  const totalMembers = active.reduce((sum, group) => sum + group.memberCount, 0);
  const orphans = active.filter((group) => !group.staffMember).length;

  const rows: GroupRow[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    programName: group.program?.name ?? null,
    levelLabel: group.level ? LEVEL_LABELS[group.level] ?? group.level : null,
    teacher: group.staffMember
      ? { id: group.staffMember.id, name: group.staffMember.name }
      : null,
    schedule: group.schedule,
    status: group.status,
    memberCount: group.memberCount,
    capacity: group.capacity,
    sessionCount: group.sessionCount,
    nextSession: group.nextSessionAt
      ? formatDayMonth(group.nextSessionAt, timeZone)
      : null,
    attendanceRate: group.attendance.rate,
    attendanceRated: group.attendance.rated,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Groupes</h2>
          <p className="mt-1 text-muted-foreground">
            {active.length} groupe{active.length > 1 ? "s" : ""} actif
            {active.length > 1 ? "s" : ""} · {totalMembers} inscription
            {totalMembers > 1 ? "s" : ""}
            {orphans > 0 && (
              <>
                {" "}
                · {orphans} sans enseignante
              </>
            )}
          </p>
        </div>
        <GroupDialog
          programs={programs.map((p) => ({ id: p.id, name: p.name }))}
          teachers={staff.map((s) => ({ id: s.id, name: s.name }))}
          onDone="fiche"
        />
      </div>

      <GroupsList rows={rows} />
    </div>
  );
}
