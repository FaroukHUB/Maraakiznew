"use client";

import { useSyncExternalStore } from "react";
import { formatHijri, formatGregorian } from "@/lib/hijri";

/**
 * Date grégorienne, date hégirienne et heure courante.
 *
 * L'heure vient du navigateur, pas du serveur : useSyncExternalStore rend
 * un instantané vide côté serveur et la vraie valeur après hydratation.
 * Poser l'heure du serveur puis la corriger produirait un saut visible,
 * et une heure fausse pour toute utilisatrice d'un autre fuseau.
 */
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 1000);
  return () => clearInterval(timer);
}

export function DateClock() {
  const timestamp = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => null
  );

  if (timestamp === null) {
    return <div className="hidden lg:block w-56 h-9" aria-hidden />;
  }

  const now = new Date(timestamp * 1000);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return (
    <div className="hidden lg:flex items-center gap-3 text-right">
      <div className="leading-tight">
        <p className="text-xs font-medium capitalize">{formatGregorian(now)}</p>
        <p className="text-xs text-primary" dir="auto">
          {formatHijri(now)}
        </p>
      </div>
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {time}
      </span>
    </div>
  );
}
