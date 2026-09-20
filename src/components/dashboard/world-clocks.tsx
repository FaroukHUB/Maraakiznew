"use client";

import { Moon, Sun, Users } from "lucide-react";
import { useNow } from "@/lib/use-now";
import { formatTime } from "@/lib/datetime";
import { dayShift, hourIn, isQuietHour, offsetLabel, QUIET_HOURS } from "@/lib/timezones";
import type { ZonePresence } from "@/data/timezones";
import { cn } from "@/lib/utils";

/**
 * Les fuseaux de vos élèves.
 *
 * ── Ce que chaque ligne dit ──
 *
 * L'heure qu'il est là-bas, le décalage avec l'institut, « demain » ou
 * « hier » quand le quantième diffère, et si l'on y dort. Le ruban
 * derrière chaque ligne est la journée de 0 h à 24 h : le curseur montre
 * où en est ce fuseau, et la partie sombre les heures où l'on ne dérange
 * pas. Tout se lit d'un coup d'œil, sans calcul mental — c'est
 * exactement ce calcul qui fait proposer une séance à 3 h du matin.
 * Ce commentaire fait foi.
 *
 * Tout dépend de l'heure, donc tout attend l'hydratation : voir
 * `lib/use-now.ts`. La place est réservée pour que rien ne saute.
 */
export function WorldClocks({
  zones,
  instituteZone,
}: {
  zones: ZonePresence[];
  instituteZone: string;
}) {
  const now = useNow();

  // Un seul fuseau : il n'y a rien à comparer, le bandeau porte déjà
  // l'heure. On n'affiche pas une colonne pour dire « tout le monde est
  // au même endroit ».
  if (zones.length < 2) return null;

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
        Vos élèves dans le monde
      </p>

      <ul className="space-y-1">
        {zones.map((zone) => {
          const isHome = zone.timeZone === instituteZone;
          const time = now ? formatTime(now, zone.timeZone) : null;
          const shift = now ? dayShift(now, zone.timeZone, instituteZone) : 0;
          const quiet = now ? isQuietHour(now, zone.timeZone) : false;
          const hour = now ? hourIn(now, zone.timeZone) : 12;

          return (
            <li
              key={zone.timeZone}
              className={cn(
                "relative overflow-hidden rounded-xl border px-3 py-2",
                isHome
                  ? "border-primary/25 bg-primary/[0.06]"
                  : "border-border/60 bg-card/50"
              )}
              title={
                zone.names.length > 0
                  ? `${zone.label} — ${zone.names.join(", ")}`
                  : zone.label
              }
            >
              {now && <DayBand hour={hour} />}

              <div className="relative flex items-center gap-2.5">
                <span className="shrink-0 text-muted-foreground">
                  {quiet ? (
                    <Moon className="h-3.5 w-3.5" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-nourania-foreground" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-tight">
                    {zone.label}
                  </span>
                  <span className="block text-[0.7rem] leading-tight text-muted-foreground">
                    {isHome ? "ici" : now ? offsetLabel(now, zone.timeZone, instituteZone) : " "}
                    {zone.count > 0 && (
                      <>
                        {" · "}
                        <Users className="inline h-3 w-3 -mt-0.5" aria-hidden />{" "}
                        {zone.count}
                      </>
                    )}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-semibold tabular-nums leading-tight">
                    {time ?? "  :  "}
                  </span>
                  {shift !== 0 && (
                    <span className="block text-[0.65rem] font-medium leading-tight text-primary">
                      {shift > 0 ? "demain" : "hier"}
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Le ruban de la journée : 0 h à gauche, 24 h à droite, les heures
 * calmes assombries, et un curseur à l'heure courante.
 */
function DayBand({ hour }: { hour: number }) {
  const position = (hour / 24) * 100;
  const quietStart = (QUIET_HOURS.from / 24) * 100;
  const quietEnd = (QUIET_HOURS.to / 24) * 100;

  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1">
      <span className="absolute inset-0 bg-nourania/20" />
      <span className="absolute inset-y-0 left-0 bg-foreground/15" style={{ width: `${quietEnd}%` }} />
      <span className="absolute inset-y-0 right-0 bg-foreground/15" style={{ width: `${100 - quietStart}%` }} />
      <span
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-primary"
        style={{ left: `${position}%` }}
      />
    </span>
  );
}
