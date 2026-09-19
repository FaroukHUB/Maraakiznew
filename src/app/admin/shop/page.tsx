import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getShopItems,
  getOrdersForAdmin,
  formatPrice,
  SHOP_STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from "@/data/shop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import { ShopManager, OrderStatusButton } from "./shop-manager";

export default async function AdminShopPage() {
  await requireAdmin();
  const [items, orders] = await Promise.all([getShopItems(), getOrdersForAdmin()]);
  const pending = orders.filter((o) => o.status === "pending");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Boutique</h2>
        <p className="text-muted-foreground mt-1">
          L&apos;application enregistre les commandes et leur règlement,
          constaté par l&apos;institut — elle ne prend pas de paiement en ligne.
        </p>
      </div>

      <ShopManager items={items} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>Commandes ({orders.length})</span>
            {pending.length > 0 && (
              <span className="text-sm font-normal text-warning-foreground">
                {pending.length} à régler
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-8 text-center">
              <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucune commande.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/students/${order.studentProfileId}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {order.studentProfile.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {order.lines.map((l) => `${l.quantity} × ${l.label}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold">
                      {formatPrice(order.totalCents)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <OrderStatusButton id={order.id} status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Statuts d&apos;article : {Object.values(SHOP_STATUS_LABELS).join(", ")}.
      </p>
    </div>
  );
}
