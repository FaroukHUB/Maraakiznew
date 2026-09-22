import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assessments, assessmentResults, scorePercentage } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

// Réexport de commodité pour les composants serveur. Les composants
// CLIENT doivent importer depuis @/lib/constants : passer par ce fichier
// tirerait le driver PostgreSQL dans le bundle navigateur.
export { ASSESSMENT_TYPE_LABELS as TYPE_LABELS } from "@/lib/constants";

export async function getAssessmentsForAdmin() {
  const institute = await requireInstitute();
  const list = await db.query.assessments.findMany({
    where: eq(assessments.instituteId, institute),
    orderBy: [desc(assessments.heldOn)],
    with: { program: true, group: true, results: true },
  });

  return list.map((assessment) => {
    const scores = assessment.results.map((r) => r.score);
    const average =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null;

    return {
      ...assessment,
      resultCount: scores.length,
      averageScore: average,
      averagePercentage:
        average !== null ? scorePercentage(average, assessment.maxScore) : null,
    };
  });
}

/**
 * Détail d'une évaluation, résultats classés du meilleur au moins bon.
 *
 * Le classement sert aux concours, mais il est utile partout : il montre
 * d'un coup d'œil qui décroche.
 */
export async function getAssessmentById(id: string) {
  const institute = await requireInstitute();
  const assessment = await db.query.assessments.findFirst({
    where: and(
      eq(assessments.id, id),
      eq(assessments.instituteId, institute)
    ),
    with: {
      program: true,
      group: true,
      results: {
        with: { studentProfile: { with: { user: true } } },
      },
    },
  });
  if (!assessment) return null;

  const ranked = [...assessment.results]
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
      percentage: scorePercentage(result.score, assessment.maxScore),
    }));

  return { ...assessment, results: ranked };
}

/** Résultats d'une élève — uniquement les évaluations publiées. */
export async function getResultsForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  const rows = await db.query.assessmentResults.findMany({
    where: and(
      eq(assessmentResults.studentProfileId, studentProfileId),
      eq(assessmentResults.instituteId, institute)
    ),
    with: { assessment: { with: { program: true } } },
    orderBy: [desc(assessmentResults.gradedAt)],
  });

  return rows
    .filter((row) => row.assessment.status === "published")
    .map((row) => ({
      ...row,
      percentage: scorePercentage(row.score, row.assessment.maxScore),
    }));
}

/** Moyenne générale d'une élève sur les évaluations publiées. */
export async function getStudentAverage(
  studentProfileId: string
): Promise<number | null> {
  const results = await getResultsForStudent(studentProfileId);
  if (results.length === 0) return null;
  const sum = results.reduce((acc, r) => acc + r.percentage, 0);
  return Math.round((sum / results.length) * 10) / 10;
}

export async function getAssessmentCount(): Promise<number> {
  const institute = await requireInstitute();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assessments)
    .where(
      and(
        eq(assessments.status, "draft"),
        eq(assessments.instituteId, institute)
      )
    );
  return Number(row?.count ?? 0);
}
