"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { closeSubscription } from "@/actions/subscriptions";

const reasons = [
  { value: "student_request", label: "Demande de l'élève" },
  { value: "teacher_decision", label: "Décision de l'enseignante" },
  { value: "non_payment", label: "Défaut de paiement" },
  { value: "expired", label: "Délai dépassé" },
] as const;

export function CloseSubscriptionButton({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    if (!reason) return;
    setLoading(true);
    setError(null);

    const result = await closeSubscription(
      subscriptionId,
      reason as "student_request" | "teacher_decision" | "non_payment" | "expired"
    );

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-xs text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        Fermer ce forfait
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-8 px-2 rounded-md border border-input bg-background text-xs"
      >
        <option value="">Raison...</option>
        {reasons.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <Button
        variant="destructive"
        size="sm"
        className="text-xs"
        disabled={!reason || loading}
        onClick={handleClose}
      >
        {loading ? "..." : "Confirmer"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => setOpen(false)}
      >
        Annuler
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
