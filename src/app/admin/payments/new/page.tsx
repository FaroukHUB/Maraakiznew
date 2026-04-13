"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createPayment } from "@/actions/payments";

type Sub = {
  id: string;
  studentName: string;
  studentProfileId: string;
  programName: string;
  priceCents: number;
};

export default function NewPaymentPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSub, setSelectedSub] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [status, setStatus] = useState("received");
  const [externalRef, setExternalRef] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/admin/active-subscriptions")
      .then((r) => r.json())
      .then((data: { id: string; studentName: string; programName: string }[]) => {
        // We need studentProfileId too — fetch it from a dedicated endpoint
        // For now, reuse what we have and extend it
        setSubs(
          data.map((d) => ({
            ...d,
            studentProfileId: "", // will be set from the selected sub
            priceCents: 0,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load full sub details when selected
  useEffect(() => {
    if (!selectedSub) return;
    fetch(`/api/admin/subscription/${selectedSub}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.priceCents && !amount) {
          setAmount((data.priceCents / 100).toString());
        }
        setSubs((prev) =>
          prev.map((s) =>
            s.id === selectedSub
              ? { ...s, studentProfileId: data.studentProfileId, priceCents: data.priceCents }
              : s
          )
        );
      })
      .catch(() => {});
  }, [selectedSub]);

  const selected = subs.find((s) => s.id === selectedSub);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSub || !amount) return;
    setSubmitting(true);
    setError(null);

    const result = await createPayment({
      subscriptionId: selectedSub,
      studentProfileId: selected?.studentProfileId ?? "",
      amountCents: Math.round(parseFloat(amount) * 100),
      method: method as "paypal" | "bank_transfer" | "cash" | "other",
      status: status as "pending" | "received",
      externalReference: externalRef || undefined,
      notes: notes || undefined,
      paidAt: status === "received" ? new Date() : undefined,
    });

    if (result.success) {
      router.push("/admin/payments");
      router.refresh();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enregistrer un paiement</h2>
        <p className="text-muted-foreground mt-1">
          Associer un paiement à un forfait élève
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Forfait</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <select
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">Sélectionner un forfait</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} — {s.programName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Montant (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="60.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Méthode</Label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="cash">Espèces</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="received"
                    checked={status === "received"}
                    onChange={() => setStatus("received")}
                  />
                  Reçu
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={status === "pending"}
                    onChange={() => setStatus("pending")}
                  />
                  En attente
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Référence externe (optionnel)</Label>
              <Input
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="ID transaction PayPal, ref virement..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commentaire libre..."
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : "Enregistrer le paiement"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
