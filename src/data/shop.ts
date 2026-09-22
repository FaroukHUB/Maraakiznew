import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { shopItems, orders } from "@/db/schema";
import { requireInstitute } from "@/lib/tenant";

export { SHOP_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export async function getShopItems() {
  const institute = await requireInstitute();
  return db.query.shopItems.findMany({
    where: eq(shopItems.instituteId, institute),
    orderBy: [asc(shopItems.name)],
  });
}

/** Articles visibles par les élèves : disponibles et en stock. */
export async function getAvailableShopItems() {
  const institute = await requireInstitute();
  const list = await db.query.shopItems.findMany({
    where: and(
      eq(shopItems.status, "available"),
      eq(shopItems.instituteId, institute)
    ),
    orderBy: [asc(shopItems.name)],
  });
  return list.filter((item) => item.stock == null || item.stock > 0);
}

export async function getOrdersForAdmin() {
  const institute = await requireInstitute();
  return db.query.orders.findMany({
    where: eq(orders.instituteId, institute),
    orderBy: [desc(orders.createdAt)],
    with: { studentProfile: { with: { user: true } } },
  });
}

export async function getOrdersForStudent(studentProfileId: string) {
  const institute = await requireInstitute();
  return db.query.orders.findMany({
    where: and(
      eq(orders.studentProfileId, studentProfileId),
      eq(orders.instituteId, institute)
    ),
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getPendingOrderCount(): Promise<number> {
  const institute = await requireInstitute();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending"),
        eq(orders.instituteId, institute)
      )
    );
  return Number(row?.count ?? 0);
}
