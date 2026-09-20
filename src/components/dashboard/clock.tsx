"use client";

import { cn } from "@/lib/utils";

/**
 * L'heure, en chiffres.
 *
 * ── Pourquoi pas Intl ──
 *
 * `Intl.DateTimeFormat("fr-FR", { hour: "2-digit" })` rend « 11 h » :
 * la locale française colle son séparateur à l'heure. Pour poser un
 * deux-points qui clignote entre les heures et les minutes, il faut les
 * deux nombres séparément — donc getHours/getMinutes, formatés à la main
 * sur 24 h. Ce commentaire fait foi.
 */
export function Clock({
  now,
  size = "sm",
  withSeconds = false,
}: {
  now: Date;
  size?: "sm" | "lg";
  withSeconds?: boolean;
}) {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const big = size === "lg";

  return (
    <time
      dateTime={`${hours}:${minutes}`}
      // Le contenu est découpé en plusieurs éléments pour que le
      // deux-points puisse clignoter ; lu tel quel, cela donnerait
      // « 11 : 23 ». L'étiquette remplace donc le contenu pour les
      // lecteurs d'écran, et `dateTime` porte la valeur machine.
      aria-label={`${hours} heures ${minutes}`}
      className={cn(
        "inline-flex items-baseline font-mono tabular-nums",
        big ? "text-4xl sm:text-5xl font-semibold tracking-tight" : "text-sm font-medium"
      )}
    >
      <span>{hours}</span>
      <span className={cn("tick", big ? "mx-0.5" : "mx-px")}>:</span>
      <span>{minutes}</span>
      {withSeconds && (
        <span
          className={cn("text-muted-foreground", big ? "ml-1.5 text-lg" : "ml-1 text-xs")}
        >
          {seconds}
        </span>
      )}
    </time>
  );
}
