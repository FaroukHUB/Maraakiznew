import { eq, and, gt, gte, lt, sql, inArray, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { requireInstitute } from "@/lib/tenant";
import { pendingReason } from "@/data/attendance";
import {
  sessions,
  sessionParticipants,
  sessionResources,
  sessionNotes,
  subscriptions,
  CONSUMING_STATUSES,
  CONSUMING_ATTENDANCE_STATUSES,
} from "@/db/schema";

export async function getSessionsByPackId(
  subscriptionId: string
): Promise<(typeof sessions.$inferSelect)[]> {
  const institute = await requireInstitute();
  return db.query.sessions.findMany({
    where: and(
      eq(sessions.subscriptionId, subscriptionId),
      eq(sessions.instituteId, institute)
    ),
    orderBy: (s, { asc }) => [asc(s.sessionNumber)],
  });
}

export async function getSessionById(sessionId: string) {
  const institute = await requireInstitute();
  return db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      eq(sessions.instituteId, institute)
    ),
    with: {
      notes: true,
      participants: {
        with: { studentProfile: { with: { user: true } } },
      },
      resources: true,
    },
  });
}

export async function getUpcomingSessions(limit: number = 5) {
  const institute = await requireInstitute();
  const now = new Date();
  return db.query.sessions.findMany({
    where: and(
      eq(sessions.status, "planned"),
      gt(sessions.scheduledAt, now),
      eq(sessions.instituteId, institute)
    ),
    orderBy: (s, { asc }) => [asc(s.scheduledAt)],
    limit,
  });
}

/**
 * Séances consommées par un forfait.
 *
 * Deux sources, additionnées :
 *
 *   1. Les séances PORTÉES par ce forfait (sessions.subscriptionId), selon
 *      CONSUMING_STATUSES. C'est la règle historique, inchangée.
 *
 *   2. Les PARTICIPATIONS à une séance portée par un AUTRE forfait — le cas
 *      des cours collectifs — selon CONSUMING_ATTENDANCE_STATUSES.
 *
 * La condition `sessions.subscriptionId <> subscriptionId` du second terme
 * empêche le double comptage du forfait porteur.
 *
 * Les participations dont subscriptionId est NULL ne comptent pas : ce sont
 * celles enregistrées avant cette règle, le comportement passé est préservé.
 *
 * Unique implémentation du calcul : tout le reste de l'app passe par ici.
 */
export async function getConsumedSessionCount(
  subscriptionId: string
): Promise<number> {
  const [counts] = await getConsumedSessionCounts([subscriptionId]);
  return counts?.consumed ?? 0;
}

/**
 * Version groupée, pour les listes (fiche élève, liste des élèves).
 *
 * Évite le N+1 : une requête pour les séances portées, une pour les
 * participations, quel que soit le nombre de forfaits.
 */
export async function getConsumedSessionCounts(
  subscriptionIds: string[]
): Promise<{ subscriptionId: string; consumed: number }[]> {
  if (subscriptionIds.length === 0) return [];
  const institute = await requireInstitute();

  const owned = await db
    .select({
      subscriptionId: sessions.subscriptionId,
      count: sql<number>`count(*)`,
    })
    .from(sessions)
    .where(
      and(
        inArray(sessions.subscriptionId, subscriptionIds),
        inArray(sessions.status, [...CONSUMING_STATUSES]),
        eq(sessions.instituteId, institute)
      )
    )
    .groupBy(sessions.subscriptionId);

  const attended = await db
    .select({
      subscriptionId: sessionParticipants.subscriptionId,
      count: sql<number>`count(*)`,
    })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(
      and(
        inArray(sessionParticipants.subscriptionId, subscriptionIds),
        sql`${sessions.subscriptionId} <> ${sessionParticipants.subscriptionId}`,
        inArray(sessions.status, [...CONSUMING_STATUSES]),
        inArray(sessionParticipants.attendanceStatus, [
          ...CONSUMING_ATTENDANCE_STATUSES,
        ]),
        eq(sessionParticipants.instituteId, institute)
      )
    )
    .groupBy(sessionParticipants.subscriptionId);

  const totals = new Map(subscriptionIds.map((id) => [id, 0]));
  for (const row of owned) {
    if (row.subscriptionId) {
      totals.set(row.subscriptionId, (totals.get(row.subscriptionId) ?? 0) + Number(row.count));
    }
  }
  for (const row of attended) {
    if (row.subscriptionId) {
      totals.set(row.subscriptionId, (totals.get(row.subscriptionId) ?? 0) + Number(row.count));
    }
  }

  return [...totals].map(([subscriptionId, consumed]) => ({ subscriptionId, consumed }));
}

/**
 * Forfaits impactés par une séance : le forfait porteur, plus ceux des
 * participantes. Sert à refermer tous les forfaits arrivés à leur terme
 * après un changement de statut, pas seulement celui du porteur.
 */
export async function getSubscriptionIdsAffectedBySession(
  sessionId: string
): Promise<string[]> {
  const institute = await requireInstitute();
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      eq(sessions.instituteId, institute)
    ),
    with: { participants: true },
  });
  if (!session) return [];

  const ids = new Set<string>([session.subscriptionId]);
  for (const participant of session.participants) {
    if (participant.subscriptionId) ids.add(participant.subscriptionId);
  }
  return [...ids];
}

/**
 * Les séances du JOUR, dans l'ordre de l'horloge.
 *
 * La journée va de minuit à minuit dans le fuseau du serveur, et non
 * « les 24 prochaines heures » : une enseignante qui ouvre l'écran à 18 h
 * veut voir sa journée, celle qui se termine, pas déborder sur demain.
 * Les séances passées du jour restent affichées — c'est ce qui permet de
 * voir ce qui reste à faire de l'appel. Ce commentaire fait foi.
 */
export async function getTodaySessions() {
  const institute = await requireInstitute();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return db.query.sessions.findMany({
    where: and(
      gte(sessions.scheduledAt, start),
      lt(sessions.scheduledAt, end),
      eq(sessions.instituteId, institute)
    ),
    orderBy: (s, { asc }) => [asc(s.scheduledAt)],
    with: {
      subscription: {
        with: {
          studentProfile: { with: { user: true } },
          program: true,
        },
      },
      group: true,
    },
  });
}

export async function getWeekSessionCount(): Promise<number> {
  const institute = await requireInstitute();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        gt(sessions.scheduledAt, startOfWeek),
        sql`${sessions.scheduledAt} < ${endOfWeek}`,
        eq(sessions.instituteId, institute)
      )
    );
  return Number(result[0].count);
}

export async function getLastCompletedSession(subscriptionId: string) {
  const institute = await requireInstitute();
  const result = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.subscriptionId, subscriptionId),
      eq(sessions.status, "completed"),
      eq(sessions.instituteId, institute)
    ),
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    with: { notes: true },
  });
  return result ?? null;
}

// ─── Admin queries ───────────────────────────────────────

/**
 * Les séances, avec ce qu'il faut pour les trier à l'écran.
 *
 * ── « Passée » et « à traiter » se calculent ICI ──
 *
 * Pas dans la page : comparer à l'heure courante est un calcul qui
 * dépend du moment, et une page qui le fait pendant son rendu n'est plus
 * une fonction de ses données. Le sens, lui, est métier : une séance
 * passée restée « planifiée » n'a pas été pointée, une séance terminée
 * sans compte rendu attend le sien. Ce commentaire fait foi.
 */
export async function getAllSessionsForAdmin() {
  const institute = await requireInstitute();
  const now = Date.now();
  const rows = await db.query.sessions.findMany({
    where: eq(sessions.instituteId, institute),
    orderBy: (s, { desc }) => [desc(s.scheduledAt)],
    with: {
      subscription: {
        with: {
          studentProfile: { with: { user: true } },
          program: true,
        },
      },
      notes: true,
      group: { columns: { id: true, name: true } },
      staffMember: { columns: { id: true, name: true } },
      participants: { columns: { id: true, attendanceStatus: true } },
    },
  });

  return rows.map((session) => {
    const past = session.scheduledAt.getTime() < now;
    const hasNotes = Boolean(
      session.notes && (session.notes.content || session.notes.homework)
    );
    // Même règle que l'écran d'assiduité : `pendingReason` en est le
    // seul point d'entrée.
    const reason = past
      ? pendingReason(session.status, session.participants.length, hasNotes)
      : null;
    return { ...session, past, hasNotes, pending: reason !== null, reason };
  });
}

/**
 * Les forfaits actifs, prêts pour la planification d'une séance.
 *
 * ── Pourquoi ici et plus dans une route d'API ──
 *
 * La modale de planification est ouverte depuis une page serveur : celle-ci
 * peut lui passer la liste directement, sans aller-retour ni écran
 * d'attente. La route `/api/admin/active-subscriptions` reste pour les
 * formulaires qui la consomment encore. Ce commentaire fait foi.
 *
 * `nextSessionNumber` est le numéro de la PROCHAINE séance : c'est le
 * rang dans le forfait, pas un compteur de séances faites.
 */
export async function getActiveSubscriptionsForSelect() {
  const institute = await requireInstitute();
  const rows = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.status, "active"),
      eq(subscriptions.instituteId, institute)
    ),
    with: {
      studentProfile: { with: { user: true } },
      program: true,
      sessions: { columns: { sessionNumber: true } },
    },
  });

  return rows
    .map((sub) => {
      const nextSessionNumber =
        sub.sessions.reduce((max, s) => Math.max(max, s.sessionNumber), 0) + 1;
      return {
        id: sub.id,
        studentName: sub.studentProfile.user.name,
        programName: sub.program.name,
        totalSessions: sub.totalSessions,
        nextSessionNumber,
        /**
         * Toutes les séances du forfait sont déjà planifiées.
         *
         * L'écran doit le DIRE plutôt que de laisser choisir puis
         * refuser : un choix proposé puis rejeté ressemble à une panne.
         */
        full: nextSessionNumber > sub.totalSessions,
        // NULL veut dire « comme l'institut ».
        studentTimezone: sub.studentProfile.timezone,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "fr"));
}

export async function getSessionWithFullDetails(sessionId: string) {
  const institute = await requireInstitute();
  return db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      eq(sessions.instituteId, institute)
    ),
    with: {
      subscription: {
        with: {
          studentProfile: { with: { user: true } },
          program: true,
          sessions: true, // all sessions in this pack, for context
        },
      },
      notes: true,
      group: true,
      participants: {
        with: { studentProfile: { with: { user: true } } },
      },
      resources: true,
    },
  });
}

// ─── Student query (access-checked at page level) ───────

export async function getStudentSessionDetail(sessionId: string, studentProfileId: string) {
  const institute = await requireInstitute();
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      eq(sessions.instituteId, institute)
    ),
    with: {
      subscription: {
        with: { program: true },
      },
      notes: true,
      participants: {
        with: { studentProfile: { with: { user: true } } },
      },
      resources: true,
    },
  });
  if (!session) return null;

  // Access check: the subscription must belong to this student
  if (session.subscription.studentProfileId !== studentProfileId) {
    // For group sessions, check if the student is a participant
    const isParticipant = session.participants.some(
      (p) => p.studentProfileId === studentProfileId
    );
    if (!isParticipant) return null;
  }

  // Filter resources by visibility for this student
  const participant = session.participants.find(
    (p) => p.studentProfileId === studentProfileId
  );
  const visibleResources = session.resources.filter((r) => {
    if (r.visibleTo === "all") return true;
    // participants_only: must be a participant with replay access for videos
    if (!participant) return false;
    if (r.type === "replay_video") return participant.hasReplayAccess;
    return true;
  });

  return { ...session, resources: visibleResources };
}

export async function getNextSessionNumber(subscriptionId: string): Promise<number> {
  const institute = await requireInstitute();
  const result = await db
    .select({ max: sql<number>`coalesce(max(${sessions.sessionNumber}), 0)` })
    .from(sessions)
    .where(
      and(
        eq(sessions.subscriptionId, subscriptionId),
        eq(sessions.instituteId, institute)
      )
    );
  return Number(result[0].max) + 1;
}
