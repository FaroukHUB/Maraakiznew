import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import {
  DEFAULT_LAYOUT,
  normalizeLayout,
  type DashboardLayout,
} from "@/lib/dashboard-blocks";

/**
 * La disposition du tableau de bord d'une personne.
 *
 * Aucune ligne, une ligne vide, une préférence écrite il y a six mois qui
 * cite des blocs disparus : les trois cas donnent un écran correct. La
 * page ne doit jamais dépendre de la propreté de ce qui est en base.
 */
export async function getDashboardLayout(
  userId: string
): Promise<DashboardLayout> {
  const row = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
    columns: { dashboardLayout: true },
  });

  if (!row?.dashboardLayout) return DEFAULT_LAYOUT;
  return normalizeLayout(row.dashboardLayout);
}
