import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { shopItems, orders } from "@/db/schema";

export { SHOP_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export async function getShopItems() {
  return db.query.shopItems.findMany({ orderBy: [asc(shopItems.name)] });
}

/** Articles visibles par les élèves : disponibles et en stock. */
export async function getAvailableShopItems() {
  const list = await db.query.shopItems.findMany({
    where: eq(shopItems.status, "available"),
    orderBy: [asc(shopItems.name)],
  });
  return list.filter((item) => item.stock == null || item.stock > 0);
}

export async function getOrdersForAdmin() {
  return db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: { studentProfile: { with: { user: true } } },
  });
}

export async function getOrdersForStudent(studentProfileId: string) {
  return db.query.orders.findMany({
    where: eq(orders.studentProfileId, studentProfileId),
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getPendingOrderCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "pending"));
  return Number(row?.count ?? 0);
}
