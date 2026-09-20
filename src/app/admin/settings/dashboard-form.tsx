"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveDashboardLayout } from "@/actions/preferences";
import {
  BLOCK_KEYS,
  DASHBOARD_BLOCKS,
  DEFAULT_LAYOUT,
  MINIMAL_LAYOUT,
  orderedBlocks,
  type DashboardLayout,
} from "@/lib/dashboard-blocks";

const KIND_LABELS: Record<string, string> = {
  bandeau: "Bandeau d'accueil",
  tuile: "Chiffres",
  panneau: "Panneaux",
};

/**
 * Composer son tableau de bord.
 *
 * ── Monter et descendre, pas glisser-déposer ──
 *
 * Deux boutons par ligne plutôt qu'un glisser-déposer : cela marche au
 * clavier, au doigt sur un téléphone, et avec un lecteur d'écran, sans
 * bibliothèque. Un glisser-déposer serait plus joli et moins utilisable.
 * Ce commentaire fait foi.
 */
export function DashboardForm({ current }: { current: DashboardLayout }) {
  const router = useRouter();
  const [layout, setLayout] = useState<DashboardLayout>(current);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocks = orderedBlocks(layout);

  function update(next: DashboardLayout) {
    setLayout(next);
    setSaved(false);
  }

  function toggle(key: string) {
    update({
      ...layout,
      hidden: layout.hidden.includes(key)
        ? layout.hidden.filter((k) => k !== key)
        : [...layout.hidden, key],
    });
  }

  function move(key: string, direction: -1 | 1) {
    // On travaille sur l'ordre COMPLET, pas sur la préférence partielle :
    // déplacer un bloc jamais réordonné doit marcher du premier coup.
    const keys = blocks.map((block) => block.key);
    const index = keys.indexOf(key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= keys.length) return;
    [keys[index], keys[target]] = [keys[target], keys[index]];
    update({ ...layout, order: keys });
  }

  async function save() {
    setPending(true);
    setError(null);
    const result = await saveDashboardLayout(layout);
    if (result.success) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  const visibleCount = BLOCK_KEYS.length - layout.hidden.length;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {visibleCount} bloc{visibleCount > 1 ? "s" : ""}
            </span>{" "}
            sur {BLOCK_KEYS.length} affiché{visibleCount > 1 ? "s" : ""}.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => update(MINIMAL_LAYOUT)}>
              Épuré
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => update(DEFAULT_LAYOUT)}>
              Tout afficher
            </Button>
          </div>
        </div>

        <p className="rounded-lg border border-border/70 bg-accent/20 p-3 text-xs text-muted-foreground">
          Le salam, la date et l&apos;heure restent toujours affichés : ils ne
          se retirent pas.
        </p>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {blocks.map((block, index) => {
            const hidden = layout.hidden.includes(block.key);
            const previous = blocks[index - 1];
            const showKind = !previous || previous.kind !== block.kind;

            return (
              <li key={block.key}>
                {showKind && (
                  <p className="bg-muted/40 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {KIND_LABELS[block.kind] ?? block.kind}
                  </p>
                )}
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 transition-opacity",
                    hidden && "opacity-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(block.key)}
                    aria-pressed={!hidden}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      hidden
                        ? "border-border text-muted-foreground hover:bg-accent/40"
                        : "border-primary/30 bg-primary/10 text-primary"
                    )}
                  >
                    {hidden ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {hidden ? `Afficher ${block.label}` : `Masquer ${block.label}`}
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{block.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {block.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => move(block.key, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Monter {block.label}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === blocks.length - 1}
                      onClick={() => move(block.key, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">Descendre {block.label}</span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
          {saved && <span className="text-sm text-success">Enregistré.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
