"use client";

import { useSyncExternalStore } from "react";

/**
 * L'heure du navigateur, rafraîchie chaque seconde.
 *
 * ── Pourquoi pas l'heure du serveur ──
 *
 * Le serveur ne connaît pas le fuseau de la personne. Poser son heure au
 * rendu puis la corriger après hydratation produit un saut visible, et
 * une heure fausse pour qui n'est pas dans le fuseau du serveur. On rend
 * donc `null` côté serveur, et la vraie valeur une fois hydraté : tout ce
 * qui dépend de l'heure réserve sa place et se remplit au premier cadre.
 * Ce commentaire fait foi.
 *
 * L'instantané est arrondi à la seconde : deux appels dans la même
 * seconde renvoient la même valeur, comme React l'exige.
 */
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 1000);
  return () => clearInterval(timer);
}

function getSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function getServerSnapshot(): null {
  return null;
}

export function useNow(): Date | null {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return seconds === null ? null : new Date(seconds * 1000);
}
