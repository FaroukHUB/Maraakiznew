import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";

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
  const [row] = await db
    .select({ max: sql<string | null>`max(${invoices.number})` })
    .from(invoices)
    .where(sql`${invoices.number} like ${`${year}-%`}`);

  const lastSeq = row?.max ? parseInt(row.max.split("-")[1], 10) : 0;
  return `${year}-${String(lastSeq + 1).padStart(4, "0")}`;
}

export async function getInvoicesForAdmin() {
  return db.query.invoices.findMany({
    orderBy: [desc(invoices.createdAt)],
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
    },
  });
}

export async function getInvoiceById(id: string) {
  return db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      studentProfile: { with: { user: true } },
      subscription: { with: { program: true } },
      payment: true,
    },
  });
}

/** Factures d'une élève — les brouillons ne la regardent pas. */
export async function getInvoicesForStudent(studentProfileId: string) {
  return db.query.invoices.findMany({
    where: and(
      eq(invoices.studentProfileId, studentProfileId),
      sql`${invoices.status} <> 'draft'`
    ),
    orderBy: [desc(invoices.issueDate), desc(invoices.createdAt)],
  });
}

/** Encours : ce qui est émis et pas encore réglé. */
export async function getOutstandingTotal(): Promise<{
  count: number;
  totalCents: number;
}> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${invoices.totalCents}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "issued"));

  return { count: Number(row?.count ?? 0), totalCents: Number(row?.total ?? 0) };
}
