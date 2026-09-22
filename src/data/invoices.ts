import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

/** Montant en centimes → « 60,00 € ». */
export function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Prochain numéro de facture pour une année.
 *
 * Séquence par année civile, remise à zéro au 1er janvier : 2026-0001,
 * 2026-0002… Le numéro se calcule au moment de l'émission, depuis le plus
 * grand numéro déjà émis cette année-là.
 */
export async function nextInvoiceNumber(year: number): Promise<string> {
  const institute = await requireInstitute();
  // La suite est propre à l'établissement : un institut ne saute pas des
  // numéros parce qu'un autre a facturé. Ce commentaire fait foi.
  const [row] = await db
    .select({ max: sql<string | null>`max(${invoices.number})` })
    .from(invoices)
    .where(
      and(
        sql`${invoices.number} like ${`${year}-%`}`,
        eq(invoices.instituteId, institute)
      )
    );

  const lastSeq = row?.max ? parseInt(row.max.split("-")[1], 10) : 0;
  return `${year}-${String(lastSeq + 1).padStart(4, "0")}`;
}

export async function getInvoicesForAdmin() {
  const institute = await requireInstitute();
  return db.query.invoices.findMany({
    where: eq(invoices.instituteId, institute),
    orderBy: [desc(invoices.createdAt)],
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
    },
  });
}

export async function getInvoiceById(id: string) {
  const institute = await requireInstitute();
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.instituteId, institute)
    ),
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
      payment: true,
    },
  });
}

/** Factures d'une élève — les brouillons ne la regardent pas. */
export async function getInvoicesForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.invoices.findMany({
    where: and(
      eq(invoices.studentProfileId, studentProfileId),
      sql`${invoices.status} <> 'draft'`,
      eq(invoices.instituteId, institute)
    ),
    orderBy: [desc(invoices.issueDate), desc(invoices.createdAt)],
  });
}

/** Encours : ce qui est émis et pas encore réglé. */
export async function getOutstandingTotal(): Promise<{
  count: number;
  totalCents: number;
}> {
  const institute = await requireInstitute();
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${invoices.totalCents}), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "issued"),
        eq(invoices.instituteId, institute)
      )
    );

  return { count: Number(row?.count ?? 0), totalCents: Number(row?.total ?? 0) };
}
