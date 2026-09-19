"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { createShopItem, updateShopItem, deleteShopItem, setOrderStatus } from "@/actions/shop";
import { SHOP_STATUS_LABELS } from "@/lib/constants";

type Item = {
  id: string;
  name: string;
  priceCents: number;
  stock: number | null;
  status: "available" | "out_of_stock" | "archived";
};

function price(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export function ShopManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [stock, setStock] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    if (result.success) router.refresh();
    else setError(result.error ?? "Erreur inattendue.");
    setPending(false);
    return result.success;
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun article au catalogue.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {price(item.priceCents)} ·{" "}
                    {item.stock == null ? "stock non suivi" : `${item.stock} en stock`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      run(() =>
                        updateShopItem(item.id, {
                          status: e.target.value as Item["status"],
                        })
                      )
                    }
                    className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                  >
                    {Object.entries(SHOP_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer l'article"
                    onClick={() => run(() => deleteShopItem(item.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {adding ? (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" autoFocus />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="Prix €"
              />
              <Input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Stock (vide = non suivi)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending || !name.trim()}
                onClick={async () => {
                  const done = await run(() =>
                    createShopItem({
                      name,
                      price: parseFloat(priceInput) || 0,
                      stock: stock === "" ? undefined : parseInt(stock, 10),
                    })
                  );
                  if (done) {
                    setName("");
                    setPriceInput("");
                    setStock("");
                    setAdding(false);
                  }
                }}
              >
                Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un article
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function OrderStatusButton({
  id,
  status,
}: {
  id: string;
  status: "pending" | "paid" | "delivered" | "cancelled";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const next =
    status === "pending" ? "paid" : status === "paid" ? "delivered" : null;
  const label =
    status === "pending" ? "Marquer réglée" : status === "paid" ? "Marquer remise" : null;

  if (!next) return <Badge variant="outline" className="text-xs">—</Badge>;

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await setOrderStatus(id, next);
        if (result.success) router.refresh();
        setPending(false);
      }}
    >
      {label}
    </Button>
  );
}
