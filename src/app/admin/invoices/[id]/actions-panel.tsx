"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, CheckCircle2, Ban, Trash2, Printer } from "lucide-react";
import {
  issueInvoice,
  markInvoicePaid,
  cancelInvoice,
  deleteInvoice,
} from "@/actions/invoices";

const METHODS = [
  { value: "bank_transfer" as const, label: "Virement" },
  { value: "paypal" as const, label: "PayPal" },
  { value: "cash" as const, label: "Espèces" },
  { value: "other" as const, label: "Autre" },
];

export function InvoiceActions({
  id,
  status,
}: {
  id: string;
  status: "draft" | "issued" | "paid" | "cancelled";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("bank_transfer");
  const [reference, setReference] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur inattendue.");
    }
    setPending(false);
    return result.success;
  }

  return (
    <Card className="print:hidden">
      <CardContent className="pt-6 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {status === "draft" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={() => run(() => issueInvoice(id))}>
              <Send className="h-4 w-4 mr-2" />
              Émettre la facture
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              className="text-destructive"
              onClick={async () => {
                const done = await run(() => deleteInvoice(id));
                if (done) router.push("/admin/invoices");
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        )}

        {status === "issued" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Constater le règlement</p>
            <div className="flex flex-wrap items-end gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Référence (facultatif)"
                className="w-56 h-9"
              />
              <Button
                size="sm"
                disabled={pending}
                onClick={() => run(() => markInvoicePaid(id, method, reference))}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer réglée
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Un paiement correspondant est créé automatiquement, pour que la
              facture et la trésorerie racontent la même histoire.
            </p>
          </div>
        )}

        {(status === "issued" || status === "paid") && (
          <div className="pt-3 border-t border-border">
            {cancelling ? (
              <div className="flex flex-wrap items-end gap-2">
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motif de l'annulation"
                  className="w-72 h-9"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={pending || !reason.trim()}
                  onClick={async () => {
                    const done = await run(() => cancelInvoice(id, reason));
                    if (done) setCancelling(false);
                  }}
                >
                  Confirmer l&apos;annulation
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>
                  Retour
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => setCancelling(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Annuler la facture
              </Button>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
