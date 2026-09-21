import { requireAdmin } from "@/lib/auth-utils";
import {
  getStaffForAdmin,
  getActiveStaffForSelect,
  STAFF_ROLE_LABELS,
} from "@/data/staff";
import { getInstituteTimezone } from "@/data/settings";
import { formatDayMonth } from "@/lib/datetime";
import { StaffDialog } from "./staff-dialog";
import { StaffList, type StaffRow } from "./staff-list";

export default async function AdminStaffPage() {
  await requireAdmin();
  const [list, selectable, timeZone] = await Promise.all([
    getStaffForAdmin(),
    getActiveStaffForSelect(),
    getInstituteTimezone(),
  ]);

  const active = list.filter((member) => member.status === "active");

  const rows: StaffRow[] = list.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    roleLabel: STAFF_ROLE_LABELS[member.role] ?? member.role,
    status: member.status,
    groupNames: member.groupNames,
    groupsCount: member.groupsCount,
    studentsCount: member.studentsCount,
    lastSignIn: member.user?.lastSignInAt
      ? formatDayMonth(member.user.lastSignInAt, timeZone)
      : null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Professeurs</h2>
          <p className="mt-1 text-muted-foreground">
            {active.length} enseignante{active.length > 1 ? "s" : ""} active
            {active.length > 1 ? "s" : ""}
            {list.length > active.length && (
              <> · {list.length - active.length} inactive{list.length - active.length > 1 ? "s" : ""}</>
            )}
          </p>
        </div>
        <StaffDialog supervisors={selectable} />
      </div>

      <StaffList rows={rows} />
    </div>
  );
}
