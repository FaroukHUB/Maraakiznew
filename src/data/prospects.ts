import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { prospects, appointments } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

// Réexport pour les composants SERVEUR. Les composants client importent
// depuis @/lib/constants : passer par ce fichier tirerait le driver
// PostgreSQL dans le bundle navigateur.
export {
  PROSPECT_STATUS_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/constants";

/** Étapes du parcours, dans l'ordre. « lost » est hors parcours. */
export const FUNNEL_STAGES = ["new", "contacted", "trial_scheduled", "converted"] as const;

export async function getProspectsForAdmin() {
  const institute = await requireInstitute();
  return db.query.prospects.findMany({
    where: eq(prospects.instituteId, institute),
    orderBy: [desc(prospects.createdAt)],
    with: { program: true, appointments: true },
  });
}

export async function getProspectById(id: string) {
  const institute = await requireInstitute();
  return db.query.prospects.findFirst({
    where: and(
      eq(prospects.id, id),
      eq(prospects.instituteId, institute)
    ),
    with: {
      program: true,
      appointments: { orderBy: [asc(appointments.scheduledAt)] },
      convertedStudentProfile: { with: { user: true } },
    },
  });
}

/**
 * Répartition des prospects par étape.
 *
 * Le taux de conversion rapporte les inscrites au total HORS prospects
 * encore en cours : un prospect reçu ce matin ne doit pas faire baisser
 * le taux avant même d'avoir été appelé.
 */
export async function getFunnelStats() {
  const institute = await requireInstitute();
  const rows = await db
    .select({ status: prospects.status, count: sql<number>`count(*)` })
    .from(prospects)
    .where(eq(prospects.instituteId, institute))
    .groupBy(prospects.status);

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
  const converted = byStatus.converted ?? 0;
  const lost = byStatus.lost ?? 0;
  const settled = converted + lost;

  return {
    byStatus,
    total: rows.reduce((sum, r) => sum + Number(r.count), 0),
    converted,
    conversionRate: settled > 0 ? Math.round((converted / settled) * 1000) / 10 : null,
  };
}

/** Rendez-vous à venir, prospects et élèves confondus. */
export async function getUpcomingAppointments(limit = 20) {
  const institute = await requireInstitute();
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.status, "scheduled"),
      gte(appointments.scheduledAt, new Date()),
      eq(appointments.instituteId, institute)
    ),
    orderBy: [asc(appointments.scheduledAt)],
    limit,
    with: {
      prospect: true,
      studentProfile: { with: { user: true } },
    },
  });
}

/** Rendez-vous passés dont l'issue n'a pas été tranchée. */
export async function getPendingAppointments() {
  const institute = await requireInstitute();
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.status, "scheduled"),
      sql`${appointments.scheduledAt} < now()`,
      eq(appointments.instituteId, institute)
    ),
    orderBy: [desc(appointments.scheduledAt)],
    with: {
      prospect: true,
      studentProfile: { with: { user: true } },
    },
  });
}

export async function getAppointmentsForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.studentProfileId, studentProfileId),
      eq(appointments.instituteId, institute)
    ),
    orderBy: [desc(appointments.scheduledAt)],
  });
}

/** Prospects jamais recontactés — la file de travail du jour. */
export async function getUntouchedProspects() {
  const institute = await requireInstitute();
  return db.query.prospects.findMany({
    where: and(
      eq(prospects.status, "new"),
      isNull(prospects.convertedStudentProfileId),
      eq(prospects.instituteId, institute)
    ),
    orderBy: [asc(prospects.createdAt)],
    with: { program: true },
  });
}
