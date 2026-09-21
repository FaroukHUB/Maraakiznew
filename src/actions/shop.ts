"use server";

import { assertAdmin, assertOwnProfileOrAdmin } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { shopItems, orders, studentProfiles, type OrderLine } from "@/db/schema";

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

// ─── Articles ────────────────────────────────────────────

export async function createShopItem(data: {
  name: string;
  price: number;
  stock?: number;
  description?: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!data.name.trim()) return { success: false, error: "Le nom est obligatoire." };
    if (data.price < 0) return { success: false, error: "Le prix ne peut pas être négatif." };
    if (data.stock != null && data.stock < 0) {
      return { success: false, error: "Le stock ne peut pas être négatif." };
    }

    await db.insert(shopItems).values({
      name: data.name.trim(),
      priceCents: Math.round(data.price * 100),
      stock: data.stock ?? null,
      description: data.description?.trim() || null,
      status: "available",
    });

    revalidatePath("/admin/shop");
    revalidatePath("/student/shop");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création de l'article." };
  }
}

export async function updateShopItem(
  id: string,
  data: { price?: number; stock?: number | null; status?: "available" | "out_of_stock" | "archived" }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    await db
      .update(shopItems)
      .set({
        ...(data.price !== undefined && { priceCents: Math.round(data.price * 100) }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.status !== undefined && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(shopItems.id, id));

    revalidatePath("/admin/shop");
    revalidatePath("/student/shop");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

export async function deleteShopItem(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await db.delete(shopItems).where(eq(shopItems.id, id));
    revalidatePath("/admin/shop");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

// ─── Commandes ───────────────────────────────────────────
//
// Le stock est décrémenté à la commande : c'est la réservation qui
// immobilise l'exemplaire, pas le règlement.

export async function createOrder(data: {
  studentProfileId: string;
  items: { itemId: string; quantity: number }[];
  notes?: string;
}): Promise<ActionResult> {
  try {
    // Une élève commande pour ELLE. Sans cette vérification, il suffisait
    // de changer un identifiant pour commander au nom d'une autre.
    await assertOwnProfileOrAdmin(data.studentProfileId);

    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, data.studentProfileId),
    });
    if (!student) return { success: false, error: "Élève introuvable." };

    const wanted = data.items.filter((i) => i.quantity > 0);
    if (wanted.length === 0) {
      return { success: false, error: "Une commande doit contenir au moins un article." };
    }

    const lines: OrderLine[] = [];
    for (const wish of wanted) {
      const item = await db.query.shopItems.findFirst({
        where: eq(shopItems.id, wish.itemId),
      });
      if (!item) return { success: false, error: "Article introuvable." };
      if (item.status !== "available") {
        return { success: false, error: `« ${item.name} » n'est plus disponible.` };
      }
      if (item.stock != null && item.stock < wish.quantity) {
        return {
          success: false,
          error: `Stock insuffisant pour « ${item.name} » : ${item.stock} restant(s).`,
        };
      }
      lines.push({
        itemId: item.id,
        label: item.name,
        quantity: wish.quantity,
        unitPriceCents: item.priceCents,
      });
    }

    const totalCents = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);

    const [created] = await db
      .insert(orders)
      .values({
        studentProfileId: data.studentProfileId,
        lines,
        totalCents,
        notes: data.notes?.trim() || null,
        status: "pending",
      })
      .returning();

    for (const line of lines) {
      await db
        .update(shopItems)
        .set({ stock: sql`${shopItems.stock} - ${line.quantity}` })
        .where(sql`${shopItems.id} = ${line.itemId} and ${shopItems.stock} is not null`);
    }

    revalidatePath("/admin/shop");
    revalidatePath("/student/shop");
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "Erreur lors de la commande." };
  }
}

export async function setOrderStatus(
  id: string,
  status: "pending" | "paid" | "delivered" | "cancelled"
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
    if (!order) return { success: false, error: "Commande introuvable." };

    // Annuler rend les exemplaires réservés.
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const line of order.lines) {
        await db
          .update(shopItems)
          .set({ stock: sql`${shopItems.stock} + ${line.quantity}` })
          .where(sql`${shopItems.id} = ${line.itemId} and ${shopItems.stock} is not null`);
      }
    }

    await db
      .update(orders)
      .set({
        status,
        paidAt: status === "paid" || status === "delivered" ? order.paidAt ?? new Date() : null,
        deliveredAt: status === "delivered" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    revalidatePath("/admin/shop");
    revalidatePath("/student/shop");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de statut." };
  }
}
