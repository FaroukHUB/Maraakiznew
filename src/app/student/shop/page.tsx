import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import {
  getAvailableShopItems,
  getOrdersForStudent,
  formatPrice,
  ORDER_STATUS_LABELS,
} from "@/data/shop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import { OrderForm } from "./order-form";
import { formatDate } from "@/lib/datetime";
import { getViewerTimezone } from "@/data/timezones";

export default async function StudentShopPage() {
  const user = await requireStudent();
  const timeZone = await getViewerTimezone(user.id);
  // getStudentByUserId renvoie l'utilisateur ; le profil est dans .profile.
  const student = await getStudentByUserId(user.id);
  const [items, orders] = await Promise.all([
    getAvailableShopItems(),
    student ? getOrdersForStudent(student.profile.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Boutique</h2>
        <p className="text-muted-foreground mt-1">
          Commandez ici, le règlement se fait auprès de l&apos;institut.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun article disponible</p>
          </CardContent>
        </Card>
      ) : (
        student && (
          <OrderForm
            studentProfileId={student.profile.id}
            items={items.map((i) => ({
              id: i.id,
              name: i.name,
              priceCents: i.priceCents,
              stock: i.stock,
              description: i.description,
            }))}
          />
        )
      )}

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes commandes ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      {order.lines.map((l) => `${l.quantity} × ${l.label}`).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.createdAt, timeZone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold">
                      {formatPrice(order.totalCents)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
