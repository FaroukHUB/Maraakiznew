import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  instituteMembers,
  institutes,
  users,
  capabilitiesOf,
  ROLE_CAPABILITIES,
  type Capability,
} from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export type Member = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "teacher" | "assistant";
  status: "active" | "suspended";
  /** Droits effectifs : ceux du rôle, plus ceux accordés à la personne. */
  capabilities: Capability[];
  /** Droits accordés EN PLUS du rôle. */
  extra: Capability[];
  joinedAt: Date;
};

/**
 * L'équipe de l'établissement actif.
 *
 * ── Rôle et droits ──
 *
 * Le RÔLE donne un socle de droits (voir `ROLE_CAPABILITIES`), et l'on
 * peut en accorder d'autres à une personne en particulier. L'écran
 * montre les deux : ce que le rôle donne, et ce qui a été ajouté.
 * Sans quoi retirer un droit « déjà donné par le rôle » resterait sans
 * effet, et personne ne comprendrait pourquoi. Ce commentaire fait foi.
 */
export async function getInstituteMembers(): Promise<Member[]> {
  const institute = await requireInstitute();

  const rows = await db
    .select({
      userId: instituteMembers.userId,
      role: instituteMembers.role,
      status: instituteMembers.status,
      capabilities: instituteMembers.capabilities,
      joinedAt: instituteMembers.createdAt,
      name: users.name,
      email: users.email,
    })
    .from(instituteMembers)
    .innerJoin(users, eq(users.id, instituteMembers.userId))
    .where(eq(instituteMembers.instituteId, institute));

  return rows
    .map((row) => ({
      userId: row.userId,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      capabilities: capabilitiesOf({ role: row.role, capabilities: row.capabilities }),
      extra: (row.capabilities as Capability[]).filter(
        (c) => !ROLE_CAPABILITIES[row.role].includes(c)
      ),
      joinedAt: row.joinedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Le nom de l'établissement actif, pour les en-têtes d'écran. */
export async function getActiveInstituteName(): Promise<string> {
  const institute = await requireInstitute();
  const row = await db.query.institutes.findFirst({
    where: eq(institutes.id, institute),
    columns: { name: true },
  });
  return row?.name ?? "";
}
