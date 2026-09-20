import {
  contrast,
  ensureContrast,
  formatOklch,
  hexToOklch,
  type Oklch,
} from "./color";

/**
 * Le thème de l'institut, fabriqué à partir de DEUX couleurs.
 *
 * ── Ce qui se personnalise, et ce qui ne se personnalise pas ──
 *
 * Deux couleurs suffisent : la principale (boutons, liens, ce qui est
 * actif) et la seconde (accents, mises en valeur). Toute la palette —
 * fonds, cartes, bordures, textes, barre latérale — en est dérivée.
 *
 * Les couleurs de STATUT ne se personnalisent pas : vert « c'est bon »,
 * rouge « il y a un problème », ambre « attention ». Les laisser choisir
 * ferait des paiements en retard en vert. Elles restent fixes.
 * Ce commentaire fait foi.
 *
 * ── Le garde-fou ──
 *
 * Chaque couple texte/fond doit atteindre un contraste minimum. Une
 * couleur qui n'y arrive pas est ASSOMBRIE jusqu'à ce qu'elle y arrive,
 * sans changer de teinte — et `adjustments` dit ce qui a été corrigé,
 * pour que l'interface puisse le signaler plutôt que de le faire en
 * douce.
 */

export const DEFAULT_PRIMARY = "#a34468";
export const DEFAULT_ACCENT = "#c9a227";

/** Seuils WCAG. 4.5 pour le texte courant, 3 pour les grands éléments. */
const TEXT_ON_FILL = 4.5;
const TEXT_ON_BACKGROUND = 4.5;
const BODY_ON_BACKGROUND = 7;

export type ThemePreset = {
  id: string;
  label: string;
  primary: string;
  accent: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: "rose", label: "Rose et or", primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT },
  { id: "emeraude", label: "Émeraude et sable", primary: "#1f6f5c", accent: "#c08a3e" },
  { id: "indigo", label: "Indigo et cuivre", primary: "#3d4b8c", accent: "#b06a3b" },
  { id: "bordeaux", label: "Bordeaux et miel", primary: "#7d2b3a", accent: "#c79a33" },
  { id: "ardoise", label: "Ardoise et turquoise", primary: "#3f4a55", accent: "#2f8f8f" },
  { id: "olive", label: "Olive et terre", primary: "#5b6b2f", accent: "#a9622f" },
];

export type DerivedTheme = {
  /** Les variables CSS à poser sur :root. */
  tokens: Record<string, string>;
  /** Ce qui a dû être corrigé pour rester lisible. */
  adjustments: string[];
};

/**
 * Fabrique la palette. Une couleur illisible est corrigée, jamais
 * refusée : l'institut choisit une teinte, l'application se charge
 * qu'elle reste utilisable.
 */
export function deriveTheme(primaryHex: string, accentHex: string): DerivedTheme {
  const primaryBase = hexToOklch(primaryHex) ?? hexToOklch(DEFAULT_PRIMARY)!;
  const accentBase = hexToOklch(accentHex) ?? hexToOklch(DEFAULT_ACCENT)!;
  const adjustments: string[] = [];

  // Les neutres empruntent la teinte de la couleur principale : c'est ce
  // qui fait qu'un fond « blanc » a l'air chaud ou froid selon le thème.
  const background: Oklch = { l: 0.98, c: 0.005, h: primaryBase.h };
  const card: Oklch = { l: 0.995, c: 0.002, h: primaryBase.h };
  const foregroundBase: Oklch = { l: 0.22, c: 0.02, h: primaryBase.h };
  const nearWhite: Oklch = { l: 0.98, c: 0.005, h: primaryBase.h };

  const body = ensureContrast(foregroundBase, background, BODY_ON_BACKGROUND);
  if (body.adjusted) adjustments.push("le texte courant a été assombri");

  // La principale sert de FOND de bouton, avec un texte presque blanc,
  // ET de couleur de texte sur le fond clair. Elle doit passer les deux.
  let primary = ensureContrast(primaryBase, nearWhite, TEXT_ON_FILL);
  if (primary.adjusted) adjustments.push("la couleur principale a été assombrie pour que le texte des boutons reste lisible");
  const onBackground = ensureContrast(primary.color, background, TEXT_ON_BACKGROUND);
  if (onBackground.adjusted) {
    adjustments.push("la couleur principale a été assombrie pour rester lisible sur le fond");
    primary = { color: onBackground.color, adjusted: true };
  }

  // La seconde vit en aplat très clair, avec un texte foncé dessus.
  const accentSurface: Oklch = { l: 0.93, c: Math.min(accentBase.c, 0.05), h: accentBase.h };
  const accentText = ensureContrast(
    { l: 0.32, c: Math.min(accentBase.c, 0.09), h: accentBase.h },
    accentSurface,
    TEXT_ON_FILL
  );
  if (accentText.adjusted) adjustments.push("le texte sur les aplats de la seconde couleur a été assombri");

  // La seconde sert aussi de couleur pleine (dégradés, jalons).
  const accentSolid = ensureContrast(accentBase, background, TEXT_ON_BACKGROUND);
  if (accentSolid.adjusted) adjustments.push("la seconde couleur a été assombrie pour rester lisible sur le fond");

  const border: Oklch = { l: 0.91, c: 0.015, h: primaryBase.h };
  const muted: Oklch = { l: 0.95, c: 0.01, h: primaryBase.h };
  const mutedText = ensureContrast({ l: 0.5, c: 0.02, h: primaryBase.h }, background, TEXT_ON_BACKGROUND);
  const sidebar: Oklch = { l: 0.97, c: 0.008, h: primaryBase.h };
  const secondary: Oklch = { l: 0.94, c: 0.02, h: primaryBase.h };

  const tokens: Record<string, string> = {
    "--background": formatOklch(background),
    "--foreground": formatOklch(body.color),
    "--card": formatOklch(card),
    "--card-foreground": formatOklch(body.color),
    "--popover": formatOklch(card),
    "--popover-foreground": formatOklch(body.color),
    "--primary": formatOklch(primary.color),
    "--primary-foreground": formatOklch(nearWhite),
    "--secondary": formatOklch(secondary),
    "--secondary-foreground": formatOklch({ l: 0.35, c: 0.08, h: primaryBase.h }),
    "--muted": formatOklch(muted),
    "--muted-foreground": formatOklch(mutedText.color),
    "--accent": formatOklch(accentSurface),
    "--accent-foreground": formatOklch(accentText.color),
    "--border": formatOklch(border),
    "--input": formatOklch(border),
    "--ring": formatOklch(primary.color),
    // La seconde couleur alimente le jalon « nourania » et les dégradés.
    "--nourania": formatOklch({ l: 0.72, c: Math.min(accentBase.c, 0.13), h: accentBase.h }),
    "--nourania-foreground": formatOklch(accentSolid.color),
    "--chart-1": formatOklch(primary.color),
    "--chart-2": formatOklch({ l: 0.72, c: Math.min(accentBase.c, 0.13), h: accentBase.h }),
    "--sidebar": formatOklch(sidebar),
    "--sidebar-foreground": formatOklch(body.color),
    "--sidebar-primary": formatOklch(primary.color),
    "--sidebar-primary-foreground": formatOklch(nearWhite),
    "--sidebar-accent": formatOklch(accentSurface),
    "--sidebar-accent-foreground": formatOklch(accentText.color),
    "--sidebar-border": formatOklch(border),
    "--sidebar-ring": formatOklch(primary.color),
  };

  return { tokens, adjustments: [...new Set(adjustments)] };
}

/** Le bloc CSS à poser dans la page. */
export function themeCss(primaryHex: string, accentHex: string): string {
  const { tokens } = deriveTheme(primaryHex, accentHex);
  const body = Object.entries(tokens)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `:root{${body}}`;
}

/** Contrôle utilisable par les tests comme par l'interface. */
export function themeContrasts(primaryHex: string, accentHex: string) {
  const { tokens } = deriveTheme(primaryHex, accentHex);
  const read = (name: string) => parseOklchToken(tokens[name]);
  return {
    texteSurFond: contrast(read("--foreground"), read("--background")),
    texteSurBouton: contrast(read("--primary-foreground"), read("--primary")),
    principaleSurFond: contrast(read("--primary"), read("--background")),
    texteSurAccent: contrast(read("--accent-foreground"), read("--accent")),
    texteAttenueSurFond: contrast(read("--muted-foreground"), read("--background")),
  };
}

function parseOklchToken(token: string): Oklch {
  const match = token.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/);
  if (!match) return { l: 0, c: 0, h: 0 };
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}
