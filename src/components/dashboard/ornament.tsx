/**
 * Le motif du bandeau.
 *
 * Une rosace à huit branches, tracée en SVG plutôt qu'écrite avec une
 * glyphe : le caractère ﷽ n'existe pas dans toutes les polices, et un
 * décor qui disparaît selon la machine n'est pas un décor. Dessiné une
 * fois, il s'affiche partout pareil. Ce commentaire fait foi.
 */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
      focusable="false"
    >
      {/* Deux carrés tournés de 45° : la base de la rosace à huit branches */}
      <rect x="45" y="45" width="110" height="110" />
      <rect
        x="45"
        y="45"
        width="110"
        height="110"
        transform="rotate(45 100 100)"
      />
      <circle cx="100" cy="100" r="78" />
      <circle cx="100" cy="100" r="55" />
      <circle cx="100" cy="100" r="28" />
      {/* Les huit rayons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="100"
          y1="100"
          x2="100"
          y2="22"
          transform={`rotate(${i * 45} 100 100)`}
        />
      ))}
    </svg>
  );
}
