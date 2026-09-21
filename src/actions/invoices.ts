"use server";

import { assertAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  invoices,
  studentProfiles,
  subscriptions,
  payments,
  computeInvoiceTotal,
  type InvoiceLine,
} from "@/db/schema";
import { nextInvoiceNumber } from "@/data/invoices";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

function sanitizeLines(lines: InvoiceLine[]): InvoiceLine[] {
  return lines
    .map((line) => ({
      label: line.label.trim(),
      quantity: Number(line.quantity) || 0,
      unitPriceCents: Math.round(Number(line.unitPriceCents) || 0),
    }))
    .filter((line) => line.label.length > 0 && line.quantity > 0);
}

// ─── Création ────────────────────────────────────────────

export async function createInvoice(data: {
  studentProfileId: string;
  subscriptionId?: string;
  lines: InvoiceLine[];
  dueDate?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, data.studentProfileId),
    });
    if (!student) return { success: false, error: "Élève introuvable." };

    const lines = sanitizeLines(data.lines);
    if (lines.length === 0) {
      return { success: false, error: "Une facture doit contenir au moins une ligne." };
    }

    const [created] = await db
      .insert(invoices)
      .values({
        studentProfileId: data.studentProfileId,
        subscriptionId: data.subscriptionId || null,
        lines,
        totalCents: computeInvoiceTotal(lines),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes?.trim() || null,
        status: "draft",
      })
      .returning();

    revalidatePath("/admin/invoices");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la création de la facture." };
  }
}

/** Prépare une facture à partir d'un forfait, lignes pré-remplies. */
export async function createInvoiceFromSubscription(
  subscriptionId: string
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
      with: { program: true },
    });
    if (!sub) return { success: false, error: "Forfait introuvable." };

    return createInvoice({
      studentProfileId: sub.studentProfileId,
      subscriptionId: sub.id,
      lines: [
        {
          label: `${sub.program.name} — forfait de ${sub.totalSessions} séances`,
          quantity: 1,
          unitPriceCents: sub.priceCents,
        },
      ],
    });
  } catch {
    return { success: false, error: "Erreur lors de la préparation de la facture." };
  }
}

// ─── Modification (brouillon seulement) ──────────────────

export async function updateInvoice(
  id: string,
  data: { lines?: InvoiceLine[]; dueDate?: string | null; notes?: string | null }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) return { success: false, error: "Facture introuvable." };
    if (invoice.status !== "draft") {
      return {
        success: false,
        error: "Une facture émise ne se modifie plus. Annulez-la et créez-en une nouvelle.",
      };
    }

    const lines = data.lines ? sanitizeLines(data.lines) : undefined;
    if (lines && lines.length === 0) {
      return { success: false, error: "Une facture doit contenir au moins une ligne." };
    }

    await db
      .update(invoices)
      .set({
        ...(lines && { lines, totalCents: computeInvoiceTotal(lines) }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));

    revalidatePath(`/admin/invoices/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour de la facture." };
  }
}

// ─── Émission ────────────────────────────────────────────
//
// C'est ici que le numéro est attribué. Il n'est plus jamais réattribué,
// même si la facture est annulée : un numéro consommé reste consommé.

export async function issueInvoice(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) return { success: false, error: "Facture introuvable." };
    if (invoice.status !== "draft") {
      return { success: false, error: "Cette facture est déjà émise." };
    }
    if (invoice.lines.length === 0) {
      return { success: false, error: "Une facture vide ne peut pas être émise." };
    }

    const now = new Date();
    const number = await nextInvoiceNumber(now.getFullYear());

    await db
      .update(invoices)
      .set({ status: "issued", number, issueDate: now, updatedAt: now })
      .where(eq(invoices.id, id));

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);
    revalidatePath("/student/invoices");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'émission de la facture." };
  }
}

// ─── Règlement ───────────────────────────────────────────
//
// Constater un règlement crée aussi le paiement correspondant, pour que
// la facture et la trésorerie racontent la même histoire.

export async function markInvoicePaid(
  id: string,
  method: "paypal" | "bank_transfer" | "cash" | "other",
  externalReference?: string
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) return { success: false, error: "Facture introuvable." };
    if (invoice.status !== "issued") {
      return { success: false, error: "Seule une facture émise peut être réglée." };
    }

    const now = new Date();
    let paymentId = invoice.paymentId;

    if (!paymentId && invoice.subscriptionId) {
      const [payment] = await db
        .insert(payments)
        .values({
          subscriptionId: invoice.subscriptionId,
          studentProfileId: invoice.studentProfileId,
          amountCents: invoice.totalCents,
          method,
          status: "received",
          externalReference: externalReference?.trim() || null,
          paidAt: now,
          notes: `Règlement de la facture ${invoice.number}`,
        })
        .returning();
      paymentId = payment.id;
    }

    await db
      .update(invoices)
      .set({ status: "paid", paidAt: now, paymentId, updatedAt: now })
      .where(eq(invoices.id, id));

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);
    revalidatePath("/admin/payments");
    revalidatePath("/student/invoices");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du règlement." };
  }
}

// ─── Annulation ──────────────────────────────────────────

export async function cancelInvoice(
  id: string,
  reason: string
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) return { success: false, error: "Facture introuvable." };
    if (invoice.status === "cancelled") return { success: true };
    if (!reason.trim()) {
      return { success: false, error: "Un motif d'annulation est obligatoire." };
    }

    await db
      .update(invoices)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);
    revalidatePath("/student/invoices");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'annulation de la facture." };
  }
}

// ─── Suppression (brouillon seulement) ───────────────────

export async function deleteInvoice(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });
    if (!invoice) return { success: false, error: "Facture introuvable." };
    if (invoice.status !== "draft") {
      return {
        success: false,
        error: "Une facture émise ne se supprime pas. Annulez-la pour garder la trace.",
      };
    }

    await db.delete(invoices).where(eq(invoices.id, id));

    revalidatePath("/admin/invoices");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de la facture." };
  }
}
