import { eq, sql, and, asc, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { requireInstitute } from "@/lib/tenant";
import { getConsumedSessionCounts } from "@/data/sessions";
import {
  users,
  studentProfiles,
  studentRewards,
  studentNotes,
  studentPhotos,
  subscriptions,
  sessions,
  sessionParticipants,
  groupMembers,
  memorizationItems,
  payments,
  REWARD_POINTS,
  REWARD_LABELS,
} from "@/db/schema";

// ─── Types dérivés pour les vues enrichies ───────────────

export type StudentWithProfile = typeof users.$inferSelect & {
  profile: typeof studentProfiles.$inferSelect;
};

export type StudentWithDetails = StudentWithProfile & {
  activePack: typeof subscriptions.$inferSelect | null;
  completedSessions: number;
  paymentStatus: "pending" | "received" | "failed" | "refunded";
  programSlug: string | null;
};

// ─── Queries ─────────────────────────────────────────────

export async function getStudentByUserId(
  userId: string
): Promise<StudentWithProfile | null> {
  const institute = await requireInstitute();
  // On part du PROFIL et non de l'utilisateur : le compte est commun à
  // toute l'application, l'inscription appartient à un établissement.
  // Filtrer à la racine plutôt que vérifier après coup.
  const profile = await db.query.studentProfiles.findFirst({
    where: and(
      eq(studentProfiles.userId, userId),
      eq(studentProfiles.instituteId, institute)
    ),
    with: { user: true },
  });
  if (!profile) return null;
  return { ...profile.user, profile };
}

export async function getStudentByProfileId(
  profileId: string
): Promise<StudentWithProfile | null> {
  const institute = await requireInstitute();
  const profile = await db.query.studentProfiles.findFirst({
    where: and(
      eq(studentProfiles.id, profileId),
      eq(studentProfiles.instituteId, institute)
    ),
    with: { user: true },
  });
  if (!profile) return null;
  return { ...profile.user, profile };
}

export async function getAllStudentsWithDetails(): Promise<StudentWithDetails[]> {
  const institute = await requireInstitute();
  const allProfiles = await db.query.studentProfiles.findMany({
    where: eq(studentProfiles.instituteId, institute),
    with: {
      user: true,
      subscriptions: {
        with: {
          sessions: true,
          program: true,
        },
      },
      payments: true,
    },
  });

  // Consommation calculée par getConsumedSessionCounts : elle inclut les
  // séances de groupe portées par le forfait d'une autre élève.
  const activeSubIds = allProfiles
    .map((p) => p.subscriptions.find((s) => s.status === "active")?.id)
    .filter((id): id is string => Boolean(id));
  const consumedBySub = new Map(
    (await getConsumedSessionCounts(activeSubIds)).map((r) => [r.subscriptionId, r.consumed])
  );

  return allProfiles.map((profile) => {
    const activeSub = profile.subscriptions.find((s) => s.status === "active") ?? null;

    const completedSessions = activeSub ? consumedBySub.get(activeSub.id) ?? 0 : 0;

    const latestPayment = profile.payments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const programSlug = activeSub
      ? profile.subscriptions.find((s) => s.id === activeSub.id)
          ? (activeSub as unknown as { program: { slug: string } }).program?.slug ?? null
          : null
      : null;

    return {
      ...profile.user,
      profile,
      activePack: activeSub,
      completedSessions,
      paymentStatus: latestPayment?.status ?? "pending",
      programSlug,
    };
  });
}

// ─── Admin: full student profile ─────────────────────────

export async function getStudentFullProfile(profileId: string) {
  const institute = await requireInstitute();
  // Main profile with subscriptions, sessions, payments (4 levels max)
  const profile = await db.query.studentProfiles.findFirst({
    where: and(
      eq(studentProfiles.id, profileId),
      eq(studentProfiles.instituteId, institute)
    ),
    with: {
      user: true,
      subscriptions: {
        orderBy: (s, { desc }) => [desc(s.createdAt)],
        with: {
          program: true,
          sessions: {
            orderBy: (s, { asc }) => [asc(s.sessionNumber)],
            with: { notes: true },
          },
          payments: {
            orderBy: (p, { desc }) => [desc(p.createdAt)],
          },
        },
      },
      payments: {
        orderBy: (p, { desc }) => [desc(p.createdAt)],
      },
    },
  });
  if (!profile) return null;

  // Group participations loaded separately to avoid 6-level nesting
  // (PostgreSQL truncates aliases beyond 63 chars)
  const participations = await db.query.sessionParticipants.findMany({
    where: and(
      eq(sessionParticipants.studentProfileId, profileId),
      eq(sessionParticipants.instituteId, institute)
    ),
    with: {
      session: {
        with: {
          subscription: {
            with: { studentProfile: { with: { user: true } } },
          },
        },
      },
    },
  });

  return { ...profile, sessionParticipations: participations };
}

export async function getStudentCount(): Promise<number> {
  const institute = await requireInstitute();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentProfiles)
    .where(eq(studentProfiles.instituteId, institute));
  return Number(result[0].count);
}

// ─── Onglet Élèves ───────────────────────────────────────

/**
 * L'âge en années révolues, ou null si la date de naissance manque.
 *
 * On compare des dates civiles (« 1994-03-12 »), jamais des instants :
 * un anniversaire ne dépend pas du fuseau de celle qui regarde l'écran.
 * Seul point d'entrée du calcul de l'âge. Ce commentaire fait foi.
 */
export function ageFromBirthDate(
  birthDate: string | null,
  today = new Date()
): number | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  let age = today.getUTCFullYear() - year;
  const monthNow = today.getUTCMonth() + 1;
  const dayNow = today.getUTCDate();
  if (monthNow < month || (monthNow === month && dayNow < day)) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export type StudentRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  level: string;
  status: "active" | "suspended";
  age: number | null;
  groups: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  stars: number;
  programSlug: string | null;
  sessionsDone: number;
  sessionsTotal: number | null;
  paymentStatus: "pending" | "received" | "failed" | "refunded";
  enrolledAt: Date;
};

/**
 * La liste des élèves, telle que l'onglet l'affiche.
 *
 * ── Une requête par TABLE, pas par élève ──
 *
 * Groupes, enseignantes, étoiles : tout est lu d'un bloc puis assemblé
 * en mémoire. Interroger la base une fois par élève donnerait le même
 * écran pour vingt fois le temps, et le nombre de requêtes grandirait
 * avec l'institut. Ce commentaire fait foi.
 */
export async function getStudentsForAdmin(): Promise<StudentRow[]> {
  const institute = await requireInstitute();
  const [profiles, memberships, teachingSessions, rewards] = await Promise.all([
    db.query.studentProfiles.findMany({
      where: eq(studentProfiles.instituteId, institute),
      with: {
        user: true,
        subscriptions: { with: { program: true } },
        payments: true,
      },
    }),
    db.query.groupMembers.findMany({
      where: eq(groupMembers.instituteId, institute),
      with: { group: { with: { staffMember: true } } },
    }),
    db.query.sessions.findMany({
      where: and(
        isNotNull(sessions.staffMemberId),
        eq(sessions.instituteId, institute)
      ),
      columns: { subscriptionId: true },
      with: {
        staffMember: { columns: { id: true, name: true } },
        subscription: { columns: { studentProfileId: true } },
      },
    }),
    db.select({
      studentProfileId: studentRewards.studentProfileId,
      kind: studentRewards.kind,
    })
      .from(studentRewards)
      .where(eq(studentRewards.instituteId, institute)),
  ]);

  const activeSubIds = profiles
    .map((p) => p.subscriptions.find((s) => s.status === "active")?.id)
    .filter((id): id is string => Boolean(id));
  const consumedBySub = new Map(
    (await getConsumedSessionCounts(activeSubIds)).map((r) => [
      r.subscriptionId,
      r.consumed,
    ])
  );

  const groupsByStudent = new Map<string, { id: string; name: string }[]>();
  const teachersByStudent = new Map<string, Map<string, string>>();

  const addTeacher = (studentId: string, id: string, name: string) => {
    const known = teachersByStudent.get(studentId) ?? new Map<string, string>();
    known.set(id, name);
    teachersByStudent.set(studentId, known);
  };

  for (const membership of memberships) {
    if (!membership.group) continue;
    const list = groupsByStudent.get(membership.studentProfileId) ?? [];
    list.push({ id: membership.group.id, name: membership.group.name });
    groupsByStudent.set(membership.studentProfileId, list);
    if (membership.group.staffMember) {
      addTeacher(
        membership.studentProfileId,
        membership.group.staffMember.id,
        membership.group.staffMember.name
      );
    }
  }

  for (const session of teachingSessions) {
    const studentId = session.subscription?.studentProfileId;
    if (!studentId || !session.staffMember) continue;
    addTeacher(studentId, session.staffMember.id, session.staffMember.name);
  }

  const starsByStudent = new Map<string, number>();
  for (const reward of rewards) {
    starsByStudent.set(
      reward.studentProfileId,
      (starsByStudent.get(reward.studentProfileId) ?? 0) +
        REWARD_POINTS[reward.kind]
    );
  }

  const today = new Date();

  return profiles
    .map((profile) => {
      const activeSub = profile.subscriptions.find((s) => s.status === "active") ?? null;
      const latestPayment = [...profile.payments].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      return {
        id: profile.id,
        userId: profile.user.id,
        name: profile.user.name,
        email: profile.user.email,
        level: profile.arabicReadingLevel,
        status: profile.status,
        age: ageFromBirthDate(profile.birthDate, today),
        groups: groupsByStudent.get(profile.id) ?? [],
        teachers: [...(teachersByStudent.get(profile.id) ?? new Map())].map(
          ([id, name]) => ({ id, name })
        ),
        stars: starsByStudent.get(profile.id) ?? 0,
        programSlug: activeSub?.program?.slug ?? null,
        sessionsDone: activeSub ? consumedBySub.get(activeSub.id) ?? 0 : 0,
        sessionsTotal: activeSub?.totalSessions ?? null,
        paymentStatus: latestPayment?.status ?? "pending",
        enrolledAt: profile.createdAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Les groupes d'une élève, avec l'enseignante qui les tient. */
export async function getStudentGroups(profileId: string) {
  const institute = await requireInstitute();
  const rows = await db.query.groupMembers.findMany({
    where: and(
      eq(groupMembers.studentProfileId, profileId),
      eq(groupMembers.instituteId, institute)
    ),
    with: { group: { with: { staffMember: true, program: true } } },
  });
  return rows
    .filter((row) => row.group)
    .map((row) => ({
      membershipId: row.id,
      joinedAt: row.joinedAt,
      id: row.group.id,
      name: row.group.name,
      status: row.group.status,
      schedule: row.group.schedule,
      teacherName: row.group.staffMember?.name ?? null,
      programName: row.group.program?.name ?? null,
    }));
}

/** Les étoiles d'une élève, la plus récente d'abord. */
export async function getStudentRewards(profileId: string) {
  const institute = await requireInstitute();
  return db.query.studentRewards.findMany({
    where: and(
      eq(studentRewards.studentProfileId, profileId),
      eq(studentRewards.instituteId, institute)
    ),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    with: { grantedByUser: { columns: { name: true } } },
  });
}

/** Les notes privées portées sur une élève, la plus récente d'abord. */
export async function getStudentNotes(profileId: string) {
  const institute = await requireInstitute();
  return db.query.studentNotes.findMany({
    where: and(
      eq(studentNotes.studentProfileId, profileId),
      eq(studentNotes.instituteId, institute)
    ),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    with: { author: { columns: { name: true } } },
  });
}

/**
 * Les rappels de révision d'une élève.
 *
 * Ils ne sont pas saisis à la main : ils SORTENT du cycle de
 * mémorisation (`memorization_items.next_review_at`). Une liste de
 * rappels tenue à part de ce cycle finirait par le contredire.
 * Ce commentaire fait foi.
 */
export async function getRevisionReminders(profileId: string, limit = 5) {
  const institute = await requireInstitute();
  const items = await db.query.memorizationItems.findMany({
    where: and(
      eq(memorizationItems.studentProfileId, profileId),
      eq(memorizationItems.active, true),
      eq(memorizationItems.instituteId, institute)
    ),
    orderBy: [asc(memorizationItems.nextReviewAt)],
    limit,
  });
  const now = Date.now();
  return items.map((item) => ({
    id: item.id,
    surahNumber: item.surahNumber,
    ayahStart: item.ayahStart,
    ayahEnd: item.ayahEnd,
    nextReviewAt: item.nextReviewAt,
    overdue: item.nextReviewAt.getTime() < now,
  }));
}

export type ActivityEntry = {
  id: string;
  at: Date;
  kind: "session" | "reward" | "note" | "memorization" | "payment";
  label: string;
  detail: string | null;
};

/**
 * Les dernières activités d'une élève, tous registres confondus.
 *
 * Séances, étoiles, notes, mémorisation, paiements sont rangés sur une
 * seule frise datée. C'est ce qu'on veut voir en ouvrant une fiche :
 * « que s'est-il passé récemment », pas « que dit chaque table ».
 */
export async function getStudentActivity(
  profileId: string,
  limit = 12
): Promise<ActivityEntry[]> {
  const institute = await requireInstitute();
  const [profileSessions, rewards, notes, memorized, paid] = await Promise.all([
    db.query.sessions.findMany({
      where: and(
        inArray(
          sessions.subscriptionId,
          db
            .select({ id: subscriptions.id })
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.studentProfileId, profileId),
                eq(subscriptions.instituteId, institute)
              )
            )
        ),
        eq(sessions.instituteId, institute)
      ),
      orderBy: (s, { desc }) => [desc(s.scheduledAt)],
      limit,
      with: { notes: true },
    }),
    db.query.studentRewards.findMany({
      where: and(
        eq(studentRewards.studentProfileId, profileId),
        eq(studentRewards.instituteId, institute)
      ),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      limit,
    }),
    db.query.studentNotes.findMany({
      where: and(
        eq(studentNotes.studentProfileId, profileId),
        eq(studentNotes.instituteId, institute)
      ),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
      limit,
    }),
    db.query.memorizationItems.findMany({
      where: and(
        eq(memorizationItems.studentProfileId, profileId),
        eq(memorizationItems.instituteId, institute)
      ),
      orderBy: (m, { desc }) => [desc(m.memorizedAt)],
      limit,
    }),
    db.query.payments.findMany({
      where: and(
        eq(payments.studentProfileId, profileId),
        eq(payments.instituteId, institute)
      ),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit,
    }),
  ]);

  const entries: ActivityEntry[] = [
    ...profileSessions.map((s) => ({
      id: `session-${s.id}`,
      at: s.scheduledAt,
      kind: "session" as const,
      label: `Séance n°${s.sessionNumber}`,
      detail: s.notes?.stopReference ?? null,
    })),
    ...rewards.map((r) => ({
      id: `reward-${r.id}`,
      at: r.createdAt,
      kind: "reward" as const,
      label: REWARD_LABELS[r.kind],
      detail: r.reason,
    })),
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      at: n.createdAt,
      kind: "note" as const,
      label: "Note privée",
      detail: n.content.slice(0, 120),
    })),
    ...memorized.map((m) => ({
      id: `hifz-${m.id}`,
      at: m.memorizedAt,
      kind: "memorization" as const,
      label: `Sourate ${m.surahNumber}, versets ${m.ayahStart}–${m.ayahEnd}`,
      detail: "Mémorisation enregistrée",
    })),
    ...paid.map((p) => ({
      id: `payment-${p.id}`,
      at: p.createdAt,
      kind: "payment" as const,
      label: `Paiement ${(p.amountCents / 100).toFixed(2)} €`,
      detail: p.status === "received" ? "Reçu" : "En attente",
    })),
  ];

  return entries
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}

/**
 * Les photos d'une élève, la plus récente d'abord.
 *
 * Les OCTETS ne sont pas chargés : une galerie de douze photos ferait
 * sinon transiter cinq méga-octets à chaque rendu de la fiche, pour
 * afficher douze vignettes que le navigateur ira chercher lui-même par
 * `/api/students/[id]/photos/[photoId]`. Ce commentaire fait foi.
 */
export async function getStudentPhotos(profileId: string) {
  const institute = await requireInstitute();
  return db.query.studentPhotos.findMany({
    where: and(
      eq(studentPhotos.studentProfileId, profileId),
      eq(studentPhotos.instituteId, institute)
    ),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    columns: {
      id: true,
      caption: true,
      takenOn: true,
      createdAt: true,
      byteSize: true,
    },
  });
}
