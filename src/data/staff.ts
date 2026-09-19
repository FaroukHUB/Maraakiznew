import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { staffMembers, payrollEntries, sessions } from "@/db/schema";

export { STAFF_ROLE_LABELS, PAYROLL_STATUS_LABELS } from "@/lib/constants";

/** Bornes d'une période "YYYY-MM". */
function periodRange(period: string): { from: Date; to: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const to = new Date(year, month, 0, 23, 59, 59, 999);
  return { from, to };
}

export async function getStaffForAdmin() {
  const members = await db.query.staffMembers.findMany({
    orderBy: [asc(staffMembers.name)],
    with: { supervisor: true },
  });

  return Promise.all(
    members.map(async (member) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(eq(sessions.staffMemberId, member.id));
      return { ...member, sessionsCount: Number(row?.count ?? 0) };
    })
  );
}

export async function getStaffMemberById(id: string) {
  return db.query.staffMembers.findFirst({
    where: eq(staffMembers.id, id),
    with: {
      supervisor: true,
      supervised: true,
      payroll: { orderBy: [desc(payrollEntries.period)] },
    },
  });
}

export async function getActiveStaffForSelect() {
  return db.query.staffMembers.findMany({
    where: eq(staffMembers.status, "active"),
    orderBy: [asc(staffMembers.name)],
    columns: { id: true, name: true, role: true },
  });
}

/**
 * Activité d'un membre sur une période : ce qui sert à la supervision
 * comme au calcul de la paie.
 *
 * Seules les séances CONSOMMÉES sont comptées — une séance annulée n'a
 * pas été donnée, elle ne se rémunère pas et ne dit rien de l'activité.
 */
export async function getStaffActivity(staffMemberId: string, period: string) {
  const range = periodRange(period);
  if (!range) return { sessionsCount: 0, minutesWorked: 0 };

  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      minutes: sql<number>`coalesce(sum(${sessions.durationMinutes}), 0)`,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.staffMemberId, staffMemberId),
        gte(sessions.scheduledAt, range.from),
        lte(sessions.scheduledAt, range.to),
        sql`${sessions.status} in ('completed','student_absent')`
      )
    );

  return {
    sessionsCount: Number(row?.count ?? 0),
    minutesWorked: Number(row?.minutes ?? 0),
  };
}

/**
 * Montant dû à un membre pour une période.
 *
 * Forfait mensuel s'il existe, sinon tarif horaire × temps effectué.
 * Sans l'un ni l'autre, zéro — le membre n'est pas rémunéré par
 * l'application, ce n'est pas une donnée manquante.
 */
export async function computePayroll(staffMemberId: string, period: string) {
  const member = await db.query.staffMembers.findFirst({
    where: eq(staffMembers.id, staffMemberId),
  });
  if (!member) return null;

  const activity = await getStaffActivity(staffMemberId, period);

  let amountCents = 0;
  if (member.monthlyRateCents != null) {
    amountCents = member.monthlyRateCents;
  } else if (member.hourlyRateCents != null) {
    amountCents = Math.round((activity.minutesWorked / 60) * member.hourlyRateCents);
  }

  return { ...activity, amountCents };
}

export async function getPayrollForPeriod(period: string) {
  return db.query.payrollEntries.findMany({
    where: eq(payrollEntries.period, period),
    orderBy: [asc(payrollEntries.createdAt)],
    with: { staffMember: true },
  });
}

/** Vue de supervision : l'activité de chaque enseignante sur la période. */
export async function getSupervisionOverview(period: string) {
  const members = await db.query.staffMembers.findMany({
    where: eq(staffMembers.status, "active"),
    orderBy: [asc(staffMembers.name)],
    with: { supervisor: true },
  });

  return Promise.all(
    members.map(async (member) => ({
      ...member,
      activity: await getStaffActivity(member.id, period),
    }))
  );
}
