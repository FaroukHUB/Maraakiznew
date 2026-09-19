/**
 * Date hégirienne.
 *
 * Le calendrier « islamic » d'Intl suit le calcul astronomique retenu par
 * la plupart des applications grand public. Les instituts qui suivent
 * l'observation locale peuvent avoir un jour d'écart : c'est inhérent au
 * calendrier lunaire, pas un défaut d'affichage. La date grégorienne
 * reste affichée à côté pour lever toute ambiguïté.
 */

export function formatHijri(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fr-FR-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    // Un environnement sans données ICU complètes ne doit pas casser la page.
    return "";
  }
}

export function formatGregorian(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
