"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { recordReview } from "@/actions/memorization";

const QUALITIES = [
  { value: "weak" as const, label: "Fragile", title: "Repart au premier intervalle" },
  { value: "ok" as const, label: "Correcte", title: "Garde le même intervalle" },
  { value: "strong" as const, label: "Sûre", title: "Allonge l'intervalle" },
];

export function ReviewButtons({
  itemId,
  sessionId,
}: {
  itemId: string;
  sessionId?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(quality: "weak" | "ok" | "strong") {
    setPending(true);
    setError(null);

    const result = await recordReview(itemId, quality, { sessionId });
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
      <div className="flex items-center gap-2">
        {QUALITIES.map((q) => (
          <Button
            key={q.value}
            variant="outline"
            size="sm"
            disabled={pending}
            title={q.title}
            onClick={() => handle(q.value)}
            className="text-xs"
          >
            {q.label}
          </Button>
        ))}
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
