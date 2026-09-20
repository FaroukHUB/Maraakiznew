"use client";

import { useNow } from "@/lib/use-now";
import { formatHijriShort } from "@/lib/hijri";
import { zoneLabel } from "@/lib/timezones";
import { Clock } from "@/components/dashboard/clock";

/**
 * La date et l'heure de l'en-tête.
 *
 * ── Ce qui est montré, et pourquoi ──
 *
 * L'en-tête porte le REPÈRE : le quantième, le mois abrégé, la date
 * hégirienne, et l'heure. Pas le jour de la semaine en toutes lettres ni
 * l'année : ils prenaient la moitié de la largeur pour une information
 * qu'on a déjà en tête. La date complète vit dans le bandeau d'accueil,
 * là où il y a la place de l'écrire. Ce commentaire fait foi.
 *
 * L'heure vient du navigateur — voir `lib/use-now.ts`. Tant que la page
 * n'est pas hydratée, la place est réservée pour que l'en-tête ne saute
 * pas.
 */
export function DateClock({ timeZone }: { timeZone: string }) {
  const now = useNow();

  if (!now) {
    return <div className="hidden md:block h-10 w-[12rem]" aria-hidden />;
  }

  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { ...options, timeZone })
      .format(now)
      .replace(".", "");
  const day = part({ day: "numeric" });
  const month = part({ month: "short" });
  const weekday = part({ weekday: "short" });
  return (
    <div
      className="hidden md:flex items-center gap-2.5 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3 backdrop-blur"
      title={`Heure de ${zoneLabel(timeZone)}`}
    >
      {/* Le quantième, comme une page de calendrier */}
      <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-full bg-primary/10 leading-none">
        <span className="text-[0.55rem] font-medium uppercase text-primary/70">
          {weekday}
        </span>
        <span className="text-xs font-bold tabular-nums text-primary">{day}</span>
      </span>

      <span className="leading-tight">
        <span className="block text-xs font-medium first-letter:uppercase">{month}</span>
        <span
          dir="auto"
          className="block text-[0.7rem] text-muted-foreground first-letter:uppercase"
          title="Date hégirienne"
        >
          {formatHijriShort(now, timeZone)}
        </span>
      </span>

      <span className="h-6 w-px bg-border" aria-hidden />

      <Clock now={now} timeZone={timeZone} />
    </div>
  );
}
