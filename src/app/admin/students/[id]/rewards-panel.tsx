"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { grantReward, revokeLastReward } from "@/actions/student-followup";
import type { RewardKind } from "@/db/schema";

export type RewardCount = { kind: RewardKind; label: string; count: number };

/**
 * Les récompenses, motif par motif.
 *
 * ── Ce que font les deux boutons ──
 *
 * « + » empile un événement daté. « − » efface le dernier événement de
 * ce motif : il corrige un clic, il ne punit pas. Le total affiché est
 * toujours recalculé à partir de la pile, jamais stocké — voir
 * `starBalance` dans le schéma. Ce commentaire fait foi.
 */
export function RewardsPanel({
  profileId,
  merits,
  penalties,
  total,
}: {
  profileId: string;
  merits: RewardCount[];
  penalties: RewardCount[];
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(kind: RewardKind, direction: 1 | -1) {
    setError(null);
    startTransition(async () => {
      const result =
        direction === 1
          ? await grantReward(profileId, kind)
          : await revokeLastReward(profileId, kind);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-medium">
          <Star className="h-4 w-4 text-warning-foreground" />
          Récompenses
        </h3>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold tabular-nums",
            total < 0
              ? "bg-destructive/10 text-destructive"
              : "bg-warning/15 text-warning-foreground"
          )}
        >
          Total : {total} étoile{Math.abs(total) > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="space-y-2">
        {merits.map((entry) => (
          <Row
            key={entry.kind}
            entry={entry}
            pending={pending}
            onChange={(direction) => act(entry.kind, direction)}
          />
        ))}
      </ul>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
          Pénalités
        </p>
        <ul className="space-y-2">
          {penalties.map((entry) => (
            <Row
              key={entry.kind}
              entry={entry}
              penalty
              pending={pending}
              onChange={(direction) => act(entry.kind, direction)}
            />
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Row({
  entry,
  penalty,
  pending,
  onChange,
}: {
  entry: RewardCount;
  penalty?: boolean;
  pending: boolean;
  onChange: (direction: 1 | -1) => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2",
        penalty && "border-destructive/20 bg-destructive/5"
      )}
    >
      <span className="text-sm">{entry.label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending || entry.count === 0}
          onClick={() => onChange(-1)}
          aria-label={`Retirer : ${entry.label}`}
          className="rounded-lg border border-input p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">
          {entry.count}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => onChange(1)}
          aria-label={`Ajouter : ${entry.label}`}
          className="rounded-lg border border-input p-1.5 transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
