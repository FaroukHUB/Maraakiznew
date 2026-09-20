/**
 * Date hégirienne.
 *
 * Le calendrier « islamic » d'Intl suit le calcul astronomique retenu par
 * la plupart des applications grand public. Les instituts qui suivent
 * l'observation locale peuvent avoir un jour d'écart : c'est inhérent au
 * calendrier lunaire, pas un défaut d'affichage. La date grégorienne
 * reste affichée à côté pour lever toute ambiguïté.
 *
 * Comme toute date, elle EXIGE un fuseau : à 23 h à Paris, on est déjà
 * le lendemain à Dubaï, dans les deux calendriers.
 */

export function formatHijri(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR-u-ca-islamic", {
      timeZone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    // Un environnement sans données ICU complètes ne doit pas casser la page.
    return "";
  }
}

/**
 * La date hégirienne SANS l'année ni le « AH », pour les endroits
 * étroits. « 9 rabia ath-thani » suffit quand l'année grégorienne est
 * déjà affichée à côté.
 */
export function formatHijriShort(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR-u-ca-islamic", {
      timeZone,
      day: "numeric",
      month: "long",
    }).format(date);
  } catch {
    return "";
  }
}

