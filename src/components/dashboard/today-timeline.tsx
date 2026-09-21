"use client";

import Link from "next/link";
import { CalendarOff } from "lucide-react";
import { useNow } from "@/lib/use-now";
import { formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  at: string; // ISO — sérialisable depuis le serveur
  title: string;
  detail: string | null;
  status: "planned" | "completed" | "cancelled" | "other";
};

/**
 * La journée, de haut en bas.
 *
 * ── Le repère « maintenant » ──
 *
 * Le trait rouge se place entre deux séances selon l'heure du NAVIGATEUR,
 * pas celle du serveur : une enseignante à Casablanca et le serveur à
 * Washington ne voient pas la même heure, et un repère faux est pire que
 * pas de repère. Tant que la page n'est pas hydratée, la liste s'affiche
 * sans repère — jamais au mauvais endroit. Ce commentaire fait foi.
 */
export function TodayTimeline({
  entries,
  timeZone,
}: {
  entries: TimelineEntry[];
  /**
   * Fuseau d'affichage des heures. C'est celui de l'institut : une
   * séance de 14 h est à 14 h au planning, où que soit le navigateur qui
   * regarde. L'heure de l'élève est indiquée à part, quand elle diffère.
   */
  timeZone: string;
}) {
  const now = useNow();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CalendarOff className="h-9 w-9 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune séance aujourd&apos;hui.
        </p>
        <Link
          href="/admin/sessions?planifier=1"
          className="mt-2 text-sm text-primary hover:underline"
        >
          Planifier une séance
        </Link>
      </div>
    );
  }

  // Rang de la première séance encore à venir : le repère se pose devant.
  const nextIndex = now
    ? entries.findIndex((e) => new Date(e.at).getTime() > now.getTime())
    : -1;

  return (
    <ol className="relative space-y-1">
      {/* Le fil */}
      <span
        aria-hidden
        className="absolute left-[3.75rem] top-2 bottom-2 w-px bg-border"
      />

      {entries.map((entry, index) => {
        const at = new Date(entry.at);
        const time = formatTime(at, timeZone);
        const past = now ? at.getTime() <= now.getTime() : false;

        return (
          <li key={entry.id}>
            {index === nextIndex && now && <NowMarker now={now} timeZone={timeZone} />}

            <Link
              href={`/admin/sessions/${entry.id}`}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl py-2.5 pr-3 transition-colors",
                "hover:bg-accent/40"
              )}
            >
              <span
                className={cn(
                  "w-14 shrink-0 text-right font-mono text-sm tabular-nums",
                  past ? "text-muted-foreground/60" : "text-foreground"
                )}
              >
                {time}
              </span>

              <span
                aria-hidden
                className={cn(
                  "relative z-10 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card",
                  DOT[entry.status]
                )}
              />

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    entry.status === "cancelled" && "line-through opacity-60"
                  )}
                >
                  {entry.title}
                </span>
                {entry.detail && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.detail}
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}

      {/* La journée est finie : le repère se pose à la fin. */}
      {now && nextIndex === -1 && <NowMarker now={now} timeZone={timeZone} />}
    </ol>
  );
}

function NowMarker({ now, timeZone }: { now: Date; timeZone: string }) {
  const label = formatTime(now, timeZone);

  return (
    <div className="relative flex items-center gap-4 py-1.5" aria-hidden>
      <span className="w-14 shrink-0 text-right font-mono text-[0.7rem] font-semibold tabular-nums text-destructive">
        {label}
      </span>
      <span className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive ring-4 ring-card" />
      <span className="h-px flex-1 bg-gradient-to-r from-destructive/60 to-transparent" />
    </div>
  );
}

const DOT: Record<TimelineEntry["status"], string> = {
  planned: "bg-primary",
  completed: "bg-success",
  cancelled: "bg-muted-foreground/40",
  other: "bg-nourania",
};
