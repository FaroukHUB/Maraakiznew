"use client";

import { useNow } from "@/lib/use-now";
import { formatTime } from "@/lib/datetime";
import { dayShift, isQuietHour, offsetLabel, zoneLabel } from "@/lib/timezones";

/**
 * « Il est 21:07 chez Nour — Dubaï, +2 h. »
 *
 * ── Pourquoi une phrase plutôt qu'un simple nom de fuseau ──
 *
 * « Asia/Dubai » ne dit pas s'il est l'heure d'appeler. L'heure qu'il
 * est là-bas, si : c'est elle qui décide si on propose une séance ce
 * soir ou pas. Le fuseau de l'institut n'affiche rien de plus, il n'y a
 * rien à convertir. Ce commentaire fait foi.
 */
export function StudentLocalTime({
  timeZone,
  instituteZone,
  firstName,
}: {
  timeZone: string;
  instituteZone: string;
  firstName: string;
}) {
  const now = useNow();
  const elsewhere = timeZone !== instituteZone;

  if (!elsewhere) {
    return (
      <span className="text-muted-foreground">
        Même fuseau que l&apos;institut ({zoneLabel(timeZone)})
      </span>
    );
  }

  if (!now) {
    return <span className="text-muted-foreground">{zoneLabel(timeZone)}</span>;
  }

  const quiet = isQuietHour(now, timeZone);
  const shift = dayShift(now, timeZone, instituteZone);

  return (
    <span>
      Il est{" "}
      <span className="font-semibold tabular-nums">
        {formatTime(now, timeZone)}
      </span>{" "}
      chez {firstName}
      {shift !== 0 && (
        <span className="text-primary"> ({shift > 0 ? "demain" : "hier"})</span>
      )}
      <span className="text-muted-foreground">
        {" "}
        — {zoneLabel(timeZone)}, {offsetLabel(now, timeZone, instituteZone)}
      </span>
      {quiet && (
        <span className="text-warning-foreground"> · elle dort sans doute</span>
      )}
    </span>
  );
}
