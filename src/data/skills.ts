import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  skills,
  skillProgress,
  subscriptions,
  ACQUIRED_STATUS,
} from "@/db/schema";

// ─── Types ───────────────────────────────────────────────

export type ProgramProgress = {
  programId: string;
  programName: string;
  total: number; // compétences actives du programme
  acquired: number;
  inProgress: number;
  rate: number; // pourcentage arrondi à 1 décimale
};

export type SkillWithStatus = {
  id: string;
  unit: string | null;
  code: string | null;
  label: string;
  description: string | null;
  sortOrder: number;
  status: "not_started" | "in_progress" | "acquired";
  validatedAt: Date | null;
};

// ─── Helpers ─────────────────────────────────────────────

function buildProgress(
  programId: string,
  programName: string,
  total: number,
  acquired: number,
  inProgress: number
): ProgramProgress {
  return {
    programId,
    programName,
    total,
    acquired,
    inProgress,
    rate: total > 0 ? Math.round((acquired / total) * 1000) / 10 : 0,
  };
}

// ─── Référentiel ─────────────────────────────────────────

/** Compétences actives d'un programme, dans l'ordre pédagogique. */
export async function getSkillsByProgram(programId: string) {
  return db.query.skills.findMany({
    where: and(eq(skills.programId, programId), eq(skills.active, true)),
    orderBy: [asc(skills.sortOrder), asc(skills.createdAt)],
  });
}

/**
 * Tous les programmes avec leur référentiel.
 *
 * Inclut les compétences désactivées : c'est la vue d'administration du
 * référentiel, pas celle d'une élève.
 */
export async function getProgramsWithSkills() {
  const allPrograms = await db.query.programs.findMany({
    orderBy: (p, { asc }) => [asc(p.sortOrder)],
    with: {
      skills: {
        orderBy: [asc(skills.sortOrder), asc(skills.createdAt)],
      },
    },
  });

  return allPrograms.map((program) => ({
    ...program,
    activeSkillCount: program.skills.filter((s) => s.active).length,
  }));
}

// ─── Progression d'une élève ─────────────────────────────

/**
 * Progression d'une élève sur chacun des programmes auxquels elle est
 * (ou a été) inscrite.
 */
export async function getStudentProgress(
  studentProfileId: string
): Promise<ProgramProgress[]> {
  const subs = await db.query.subscriptions.findMany({
    where: eq(subscriptions.studentProfileId, studentProfileId),
    with: { program: true },
  });

  const uniquePrograms = new Map(subs.map((s) => [s.program.id, s.program]));
  if (uniquePrograms.size === 0) return [];

  const programIds = [...uniquePrograms.keys()];

  const rows = await db
    .select({
      programId: skills.programId,
      total: sql<number>`count(*)`,
      acquired: sql<number>`count(*) filter (where ${skillProgress.status} = 'acquired')`,
      inProgress: sql<number>`count(*) filter (where ${skillProgress.status} = 'in_progress')`,
    })
    .from(skills)
    .leftJoin(
      skillProgress,
      and(
        eq(skillProgress.skillId, skills.id),
        eq(skillProgress.studentProfileId, studentProfileId)
      )
    )
    .where(and(inArray(skills.programId, programIds), eq(skills.active, true)))
    .groupBy(skills.programId);

  const byProgram = new Map(rows.map((r) => [r.programId, r]));

  return programIds.map((programId) => {
    const row = byProgram.get(programId);
    return buildProgress(
      programId,
      uniquePrograms.get(programId)!.name,
      Number(row?.total ?? 0),
      Number(row?.acquired ?? 0),
      Number(row?.inProgress ?? 0)
    );
  });
}

/** Référentiel d'un programme annoté du statut de l'élève. */
export async function getStudentSkillsForProgram(
  studentProfileId: string,
  programId: string
): Promise<SkillWithStatus[]> {
  const programSkills = await getSkillsByProgram(programId);
  if (programSkills.length === 0) return [];

  const progress = await db.query.skillProgress.findMany({
    where: and(
      eq(skillProgress.studentProfileId, studentProfileId),
      inArray(
        skillProgress.skillId,
        programSkills.map((s) => s.id)
      )
    ),
  });
  const bySkill = new Map(progress.map((p) => [p.skillId, p]));

  return programSkills.map((skill) => {
    const entry = bySkill.get(skill.id);
    return {
      id: skill.id,
      unit: skill.unit,
      code: skill.code,
      label: skill.label,
      description: skill.description,
      sortOrder: skill.sortOrder,
      status: entry?.status ?? "not_started",
      validatedAt: entry?.validatedAt ?? null,
    };
  });
}

// ─── Vue d'ensemble ──────────────────────────────────────

/**
 * Progression moyenne par programme, sur les élèves ayant un forfait actif.
 *
 * C'est la moyenne des progressions individuelles, pas le ratio global :
 * une élève inscrite depuis un mois ne doit pas peser autant qu'une élève
 * présente depuis un an dans la lecture du chiffre.
 */
export async function getAverageProgressByProgram(): Promise<
  (ProgramProgress & { studentCount: number })[]
> {
  const activeSubs = await db.query.subscriptions.findMany({
    where: eq(subscriptions.status, "active"),
    with: { program: true },
  });

  const studentsByProgram = new Map<string, { name: string; students: Set<string> }>();
  for (const sub of activeSubs) {
    const entry = studentsByProgram.get(sub.program.id) ?? {
      name: sub.program.name,
      students: new Set<string>(),
    };
    entry.students.add(sub.studentProfileId);
    studentsByProgram.set(sub.program.id, entry);
  }

  const results: (ProgramProgress & { studentCount: number })[] = [];

  for (const [programId, { name, students }] of studentsByProgram) {
    const programSkills = await getSkillsByProgram(programId);
    const total = programSkills.length;
    const studentIds = [...students];

    if (total === 0 || studentIds.length === 0) {
      results.push({ ...buildProgress(programId, name, total, 0, 0), studentCount: studentIds.length });
      continue;
    }

    const rows = await db
      .select({
        studentProfileId: skillProgress.studentProfileId,
        acquired: sql<number>`count(*) filter (where ${skillProgress.status} = 'acquired')`,
        inProgress: sql<number>`count(*) filter (where ${skillProgress.status} = 'in_progress')`,
      })
      .from(skillProgress)
      .where(
        and(
          inArray(skillProgress.studentProfileId, studentIds),
          inArray(
            skillProgress.skillId,
            programSkills.map((s) => s.id)
          )
        )
      )
      .groupBy(skillProgress.studentProfileId);

    const byStudent = new Map(rows.map((r) => [r.studentProfileId, r]));

    const rateSum = studentIds.reduce((sum, id) => {
      const acquired = Number(byStudent.get(id)?.acquired ?? 0);
      return sum + acquired / total;
    }, 0);

    const acquiredSum = studentIds.reduce(
      (sum, id) => sum + Number(byStudent.get(id)?.acquired ?? 0),
      0
    );
    const inProgressSum = studentIds.reduce(
      (sum, id) => sum + Number(byStudent.get(id)?.inProgress ?? 0),
      0
    );

    results.push({
      programId,
      programName: name,
      total,
      acquired: acquiredSum,
      inProgress: inProgressSum,
      rate: Math.round((rateSum / studentIds.length) * 1000) / 10,
      studentCount: studentIds.length,
    });
  }

  return results.sort((a, b) => a.programName.localeCompare(b.programName));
}

/**
 * Compétences validées lors d'une séance donnée.
 *
 * Sert à afficher, sur la fiche d'une séance, ce qui y a été acquis.
 */
export async function getSkillsValidatedInSession(sessionId: string) {
  return db.query.skillProgress.findMany({
    where: and(
      eq(skillProgress.sessionId, sessionId),
      eq(skillProgress.status, ACQUIRED_STATUS)
    ),
    with: {
      skill: true,
      studentProfile: { with: { user: true } },
    },
  });
}
