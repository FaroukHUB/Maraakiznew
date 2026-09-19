import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { prospects, appointments } from "@/db/schema";

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
  return db.query.prospects.findMany({
    orderBy: [desc(prospects.createdAt)],
    with: { program: true, appointments: true },
  });
}

export async function getProspectById(id: string) {
  return db.query.prospects.findFirst({
    where: eq(prospects.id, id),
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
  const rows = await db
    .select({ status: prospects.status, count: sql<number>`count(*)` })
    .from(prospects)
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
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.status, "scheduled"),
      gte(appointments.scheduledAt, new Date())
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
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.status, "scheduled"),
      sql`${appointments.scheduledAt} < now()`
    ),
    orderBy: [desc(appointments.scheduledAt)],
    with: {
      prospect: true,
      studentProfile: { with: { user: true } },
    },
  });
}

export async function getAppointmentsForStudent(studentProfileId: string) {
  return db.query.appointments.findMany({
    where: eq(appointments.studentProfileId, studentProfileId),
    orderBy: [desc(appointments.scheduledAt)],
  });
}

/** Prospects jamais recontactés — la file de travail du jour. */
export async function getUntouchedProspects() {
  return db.query.prospects.findMany({
    where: and(eq(prospects.status, "new"), isNull(prospects.convertedStudentProfileId)),
    orderBy: [asc(prospects.createdAt)],
    with: { program: true },
  });
}
