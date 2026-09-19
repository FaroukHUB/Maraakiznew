"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { createOrder } from "@/actions/shop";

type Item = {
  id: string;
  name: string;
  priceCents: number;
  stock: number | null;
  description: string | null;
};

function price(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export function OrderForm({
  studentProfileId,
  items,
}: {
  studentProfileId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + (parseInt(quantities[item.id] ?? "0", 10) || 0) * item.priceCents,
    0
  );

  async function submit() {
    setPending(true);
    setError(null);
    setDone(false);

    const result = await createOrder({
      studentProfileId,
      items: items.map((item) => ({
        itemId: item.id,
        quantity: parseInt(quantities[item.id] ?? "0", 10) || 0,
      })),
    });

    if (result.success) {
      setQuantities({});
      setDone(true);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {price(item.priceCents)}
                  {item.stock != null && ` · ${item.stock} disponible${item.stock > 1 ? "s" : ""}`}
                </p>
              </div>
              <Input
                type="number"
                min="0"
                max={item.stock ?? undefined}
                value={quantities[item.id] ?? ""}
                onChange={(e) =>
                  setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                placeholder="0"
                className="w-20 h-9 text-center shrink-0"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {done && <p className="text-sm text-success">Commande enregistrée.</p>}

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <span className="text-sm">
            Total <span className="font-bold text-lg ml-2">{price(total)}</span>
          </span>
          <Button disabled={pending || total === 0} onClick={submit}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            {pending ? "Envoi..." : "Commander"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
