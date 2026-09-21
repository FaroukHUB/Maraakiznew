/**
 * Les noms des cookies de confort d'affichage.
 *
 * ── Pourquoi un fichier à part ──
 *
 * Ce nom est lu par le SERVEUR (pour rendre la page dans le bon mode) et
 * écrit par le NAVIGATEUR (au clic). Il ne peut donc vivre ni dans un
 * module « use client » — le serveur n'en recevrait qu'une référence,
 * pas la chaîne — ni dans un composant serveur, que le navigateur ne
 * charge pas. Ce commentaire fait foi.
 */
export const VIEW_COOKIE_STUDENTS = "maraakiz-vue-eleves";

/** Un an : c'est un confort personnel, pas une donnée de l'institut. */
export const VIEW_COOKIE_MAX_AGE = 31_536_000;
