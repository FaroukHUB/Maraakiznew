import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  staffMembers,
  payrollEntries,
  sessions,
  sessionNotes,
  groups,
  subscriptions,
} from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

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

/**
 * La liste des membres, avec ce qu'on veut voir sans cliquer.
 *
 * ── Ce qu'on compte, et pourquoi ──
 *
 * Les GROUPES tenus, les ÉLÈVES suivies, et la dernière CONNEXION. Le
 * nombre de séances ne dit rien au premier coup d'œil — une enseignante
 * qui a donné 300 séances l'an dernier et rien depuis six mois paraît
 * plus active que celle qui tient deux groupes aujourd'hui.
 *
 * Les élèves suivies se comptent par les groupes tenus ET par les
 * séances individuelles données : une enseignante qui ne fait que du
 * cours particulier n'a aucun groupe, et ses élèves comptent quand même.
 * Une élève vue des deux façons n'est comptée qu'une fois.
 * Ce commentaire fait foi.
 */
export async function getStaffForAdmin() {
  const institute = await requireInstitute();
  const members = await db.query.staffMembers.findMany({
    where: eq(staffMembers.instituteId, institute),
    orderBy: [asc(staffMembers.name)],
    with: { supervisor: true, user: true, groups: true },
  });

  return Promise.all(
    members.map(async (member) => ({
      ...member,
      ...(await getStaffReach(member.id)),
    }))
  );
}

/**
 * Le rayonnement d'un membre : ses groupes, ses élèves, ses séances.
 */
export async function getStaffReach(staffMemberId: string) {
  const institute = await requireInstitute();
  const [ownGroups, individualRows, sessionRow] = await Promise.all([
    db.query.groups.findMany({
      where: and(
        eq(groups.staffMemberId, staffMemberId),
        eq(groups.instituteId, institute)
      ),
      with: { members: true },
    }),
    db
      .selectDistinct({ studentProfileId: subscriptions.studentProfileId })
      .from(sessions)
      .innerJoin(subscriptions, eq(subscriptions.id, sessions.subscriptionId))
      .where(
        and(
          eq(sessions.staffMemberId, staffMemberId),
          eq(sessions.instituteId, institute)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(
        and(
          eq(sessions.staffMemberId, staffMemberId),
          eq(sessions.instituteId, institute)
        )
      )
      .then((rows) => rows[0]),
  ]);

  const students = new Set<string>();
  for (const group of ownGroups) {
    for (const member of group.members) students.add(member.studentProfileId);
  }
  for (const row of individualRows) {
    if (row.studentProfileId) students.add(row.studentProfileId);
  }

  return {
    groupNames: ownGroups.map((group) => group.name),
    groupsCount: ownGroups.length,
    studentsCount: students.size,
    sessionsCount: Number(sessionRow?.count ?? 0),
  };
}

export async function getStaffMemberById(id: string) {
  const institute = await requireInstitute();
  return db.query.staffMembers.findFirst({
    where: and(
      eq(staffMembers.id, id),
      eq(staffMembers.instituteId, institute)
    ),
    with: {
      supervisor: true,
      supervised: true,
      user: true,
      groups: { with: { program: true, members: true } },
      payroll: { orderBy: [desc(payrollEntries.period)] },
    },
  });
}

/**
 * Le cahier de textes d'une enseignante : ce qu'elle a écrit, séance
 * après séance.
 *
 * Seules les séances qui PORTENT une note apparaissent. Une séance sans
 * note n'est pas une ligne vide à afficher, c'est simplement une séance
 * dont il n'y a rien à dire.
 */
export async function getStaffNotebook(staffMemberId: string, limit = 50) {
  // On récupère d'abord les séances QUI ONT une note, puis on filtre
  // dessus. Une sous-requête écrite en SQL brut se qualifiait avec la
  // table englobante — « sessions.session_id » — et cassait la page :
  // deux requêtes simples valent mieux qu'une astuce fausse.
  // Ce commentaire fait foi.
  const institute = await requireInstitute();
  const noted = await db
    .selectDistinct({ sessionId: sessionNotes.sessionId })
    .from(sessionNotes)
    .where(eq(sessionNotes.instituteId, institute));
  const ids = noted.map((row) => row.sessionId).filter(Boolean) as string[];
  if (ids.length === 0) return [];

  return db.query.sessions.findMany({
    where: and(
      eq(sessions.staffMemberId, staffMemberId),
      inArray(sessions.id, ids),
      eq(sessions.instituteId, institute)
    ),
    orderBy: [desc(sessions.scheduledAt)],
    limit,
    with: {
      notes: true,
      group: true,
      subscription: {
        with: { studentProfile: { with: { user: true } }, program: true },
      },
    },
  });
}

/**
 * Les élèves d'une enseignante, groupes et cours particuliers réunis.
 *
 * Chaque élève apparaît UNE fois, avec la ou les raisons pour lesquelles
 * elle est là : « Groupe SAMIA », « cours particulier ». Deux lignes
 * pour la même élève obligeraient à faire le tri à l'œil.
 */
export async function getStaffStudents(staffMemberId: string) {
  const institute = await requireInstitute();
  const [ownGroups, individual] = await Promise.all([
    db.query.groups.findMany({
      where: and(
        eq(groups.staffMemberId, staffMemberId),
        eq(groups.instituteId, institute)
      ),
      with: {
        members: { with: { studentProfile: { with: { user: true } } } },
      },
    }),
    db.query.sessions.findMany({
      where: and(
        eq(sessions.staffMemberId, staffMemberId),
        eq(sessions.instituteId, institute)
      ),
      with: {
        subscription: {
          with: { studentProfile: { with: { user: true } }, program: true },
        },
      },
    }),
  ]);

  const byStudent = new Map<
    string,
    { id: string; name: string; reasons: Set<string> }
  >();

  const add = (id: string, name: string, reason: string) => {
    const entry = byStudent.get(id) ?? { id, name, reasons: new Set<string>() };
    entry.reasons.add(reason);
    byStudent.set(id, entry);
  };

  for (const group of ownGroups) {
    for (const member of group.members) {
      const user = member.studentProfile?.user;
      if (user) add(member.studentProfileId, user.name, group.name);
    }
  }
  for (const session of individual) {
    const profile = session.subscription?.studentProfile;
    if (profile?.user) add(profile.id, profile.user.name, "Cours particulier");
  }

  return [...byStudent.values()]
    .map((entry) => ({ ...entry, reasons: [...entry.reasons] }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function getActiveStaffForSelect() {
  const institute = await requireInstitute();
  return db.query.staffMembers.findMany({
    where: and(
      eq(staffMembers.status, "active"),
      eq(staffMembers.instituteId, institute)
    ),
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
  const institute = await requireInstitute();

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
        sql`${sessions.status} in ('completed','student_absent')`,
        eq(sessions.instituteId, institute)
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
  const institute = await requireInstitute();
  const member = await db.query.staffMembers.findFirst({
    where: and(
      eq(staffMembers.id, staffMemberId),
      eq(staffMembers.instituteId, institute)
    ),
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
  const institute = await requireInstitute();
  return db.query.payrollEntries.findMany({
    where: and(
      eq(payrollEntries.period, period),
      eq(payrollEntries.instituteId, institute)
    ),
    orderBy: [asc(payrollEntries.createdAt)],
    with: { staffMember: true },
  });
}

/** Vue de supervision : l'activité de chaque enseignante sur la période. */
export async function getSupervisionOverview(period: string) {
  const institute = await requireInstitute();
  const members = await db.query.staffMembers.findMany({
    where: and(
      eq(staffMembers.status, "active"),
      eq(staffMembers.instituteId, institute)
    ),
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
