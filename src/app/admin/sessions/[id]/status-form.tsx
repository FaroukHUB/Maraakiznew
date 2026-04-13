"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateSessionStatus } from "@/actions/sessions";

const statuses = [
  { value: "planned", label: "Planifiée", description: "Séance pas encore tenue" },
  { value: "completed", label: "Terminée", description: "Séance effectuée — consomme le forfait" },
  { value: "cancelled", label: "Annulée", description: "Annulation neutre — on replanifie" },
  { value: "student_absent", label: "Élève absente", description: "Séance perdue — consomme le forfait" },
  { value: "teacher_absent", label: "Prof absente", description: "L'élève ne perd pas sa séance" },
] as const;

export function StatusForm({
  sessionId,
  currentStatus,
}: {
  sessionId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setLoading(true);
    setError(null);

    const result = await updateSessionStatus(
      sessionId,
      newStatus as "planned" | "completed" | "cancelled" | "student_absent" | "teacher_absent"
    );

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Button
            key={s.value}
            variant={currentStatus === s.value ? "default" : "outline"}
            size="sm"
            disabled={loading}
            onClick={() => handleChange(s.value)}
            title={s.description}
          >
            {s.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {statuses.find((s) => s.value === currentStatus)?.description}
      </p>
    </div>
  );
}
