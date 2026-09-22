import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { certificates, type CertificateBasis } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";
import { getStudentProgress } from "@/data/skills";
import { getStudentAverage } from "@/data/assessments";
import { getAttendanceForStudent } from "@/data/attendance";
import { getMemorizedAyahCount } from "@/data/memorization";
import { getConsumedSessionCounts } from "@/data/sessions";
import { subscriptions } from "@/db/schema";

export const MENTION_LABELS: Record<string, string> = {
  passable: "Passable",
  bien: "Bien",
  tres_bien: "Très bien",
  excellent: "Excellent",
};

/**
 * Rassemble les éléments justificatifs d'un diplôme.
 *
 * Le score global est la moyenne des indicateurs DISPONIBLES : si une
 * élève n'a passé aucune évaluation, la note n'entre pas dans le calcul
 * plutôt que d'être comptée comme zéro. Un institut qui n'utilise pas les
 * évaluations ne doit pas voir tous ses diplômes plafonner.
 */
export async function computeCertificateBasis(
  studentProfileId: string,
  programId: string | null
): Promise<{ basis: CertificateBasis; overallScore: number }> {
  const progress = await getStudentProgress(studentProfileId);
  const scoped = programId
    ? progress.filter((p) => p.programId === programId)
    : progress;

  const skillsAcquired = scoped.reduce((sum, p) => sum + p.acquired, 0);
  const skillsTotal = scoped.reduce((sum, p) => sum + p.total, 0);
  const progressRate =
    skillsTotal > 0 ? Math.round((skillsAcquired / skillsTotal) * 1000) / 10 : 0;

  const assessmentAverage = await getStudentAverage(studentProfileId);
  const attendance = await getAttendanceForStudent(studentProfileId);
  const attendanceRate = attendance.rated > 0 ? attendance.rate : null;
  const memorizedAyahs = await getMemorizedAyahCount(studentProfileId);

  const institute = await requireInstitute();
  const subs = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.studentProfileId, studentProfileId),
      eq(subscriptions.instituteId, institute)
    ),
  });
  const consumed = await getConsumedSessionCounts(subs.map((s) => s.id));
  const sessionsCompleted = consumed.reduce((sum, c) => sum + c.consumed, 0);

  // Moyenne des seuls indicateurs renseignés.
  const available: number[] = [];
  if (skillsTotal > 0) available.push(progressRate);
  if (assessmentAverage !== null) available.push(assessmentAverage);
  if (attendanceRate !== null) available.push(attendanceRate);

  const overallScore =
    available.length > 0
      ? Math.round(available.reduce((a, b) => a + b, 0) / available.length)
      : 0;

  return {
    basis: {
      skillsAcquired,
      skillsTotal,
      progressRate,
      assessmentAverage,
      attendanceRate,
      memorizedAyahs,
      sessionsCompleted,
    },
    overallScore,
  };
}

/** Référence unique, séquentielle par année : DIP-2026-0001. */
export async function nextCertificateReference(year: number): Promise<string> {
  const institute = await requireInstitute();
  // La séquence est propre à l'établissement : deux instituts ne
  // partagent pas une suite de numéros, et l'un ne déduit pas le nombre
  // de diplômes de l'autre. Ce commentaire fait foi.
  const [row] = await db
    .select({ max: sql<string | null>`max(${certificates.reference})` })
    .from(certificates)
    .where(
      and(
        sql`${certificates.reference} like ${`DIP-${year}-%`}`,
        eq(certificates.instituteId, institute)
      )
    );

  const lastSeq = row?.max ? parseInt(row.max.split("-")[2], 10) : 0;
  return `DIP-${year}-${String(lastSeq + 1).padStart(4, "0")}`;
}

export async function getCertificatesForAdmin() {
  const institute = await requireInstitute();
  return db.query.certificates.findMany({
    where: eq(certificates.instituteId, institute),
    orderBy: [desc(certificates.createdAt)],
    with: { studentProfile: { with: { user: true } }, program: true },
  });
}

export async function getCertificateById(id: string) {
  const institute = await requireInstitute();
  return db.query.certificates.findFirst({
    where: and(
      eq(certificates.id, id),
      eq(certificates.instituteId, institute)
    ),
    with: { studentProfile: { with: { user: true } }, program: true },
  });
}

/** Diplômes d'une élève — les brouillons ne la regardent pas. */
export async function getCertificatesForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.certificates.findMany({
    where: and(
      sql`${certificates.studentProfileId} = ${studentProfileId} and ${certificates.status} <> 'draft'`,
      eq(certificates.instituteId, institute)
    ),
    orderBy: [desc(certificates.issuedOn)],
    with: { program: true },
  });
}
