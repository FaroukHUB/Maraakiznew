/**
 * Conversions de couleur, et contraste.
 *
 * ── Pourquoi oklch ──
 *
 * Le thème de l'application est écrit en oklch. Dans cet espace, changer
 * la CLARTÉ ne change pas la teinte perçue : on peut donc assombrir un
 * rose choisi par l'institut jusqu'à ce qu'il soit lisible, sans qu'il
 * cesse d'être son rose. En hsl, la même opération le rendrait terne.
 * Ce commentaire fait foi.
 *
 * Les formules sont celles d'Ottosson (oklab), et le contraste celui de
 * WCAG 2.1 — le seul que les audits d'accessibilité mesurent.
 */

export type Oklch = { l: number; c: number; h: number };

/** « #a3184f » → {r,g,b} sur 0–1. Renvoie null si la chaîne est invalide. */
export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function fromLinear(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

export function hexToOklch(hex: string): Oklch | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(okA * okA + okB * okB);
  const hue = chroma < 1e-6 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;

  return { l: okL, c: chroma, h: hue };
}

export function oklchToRgb({ l, c, h }: Oklch): { r: number; g: number; b: number } {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b2 = c * Math.sin(rad);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b2) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b2) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b2) ** 3;

  return {
    r: fromLinear(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    g: fromLinear(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    b: fromLinear(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  };
}

/** Luminance relative WCAG. Les canaux hors gamut sont ramenés à 0–1. */
export function luminance(color: Oklch): number {
  const { r, g, b } = oklchToRgb(color);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return (
    0.2126 * toLinear(clamp(r)) +
    0.7152 * toLinear(clamp(g)) +
    0.0722 * toLinear(clamp(b))
  );
}

/** Rapport de contraste WCAG, de 1 (identique) à 21 (noir sur blanc). */
export function contrast(a: Oklch, b: Oklch): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Assombrit — ou éclaircit — une couleur JUSQU'À atteindre le contraste
 * demandé avec une autre, sans toucher à sa teinte.
 *
 * C'est le garde-fou du thème sur mesure : une institutrice qui choisit
 * un jaune pâle pour ses boutons obtient un jaune plus soutenu, pas une
 * interface illisible. Si même le noir ou le blanc n'atteint pas la
 * cible, on rend le plus contrasté des deux : mieux vaut le meilleur
 * possible qu'un échec silencieux.
 */
export function ensureContrast(
  color: Oklch,
  against: Oklch,
  target: number
): { color: Oklch; adjusted: boolean } {
  if (contrast(color, against) >= target) return { color, adjusted: false };

  const darker = against.l > 0.5; // fond clair → on assombrit
  let best = color;
  let bestRatio = contrast(color, against);

  // Recherche pas à pas sur la clarté : 100 essais suffisent au centième.
  for (let step = 1; step <= 100; step++) {
    const l = darker ? color.l - step / 100 : color.l + step / 100;
    if (l < 0 || l > 1) break;
    const candidate = { ...color, l };
    const ratio = contrast(candidate, against);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= target) return { color: candidate, adjusted: true };
  }

  return { color: best, adjusted: true };
}

/** « oklch(0.55 0.12 350) », arrondi pour rester lisible dans le CSS. */
export function formatOklch({ l, c, h }: Oklch): string {
  const round = (value: number, digits: number) =>
    Number(value.toFixed(digits)).toString();
  return `oklch(${round(Math.min(1, Math.max(0, l)), 4)} ${round(Math.max(0, c), 4)} ${round(h, 2)})`;
}
