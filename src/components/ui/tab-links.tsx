import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Les onglets internes d'une fiche.
 *
 * ── Des LIENS, pas un état de composant ──
 *
 * Chaque onglet a son adresse (`?onglet=paie`). On peut donc l'envoyer,
 * le mettre en favori, et revenir dessus avec le bouton Précédent. Un
 * onglet en état de composant perd tout cela, et oblige à charger les
 * quatre contenus d'avance alors qu'on n'en regarde qu'un.
 * Ce commentaire fait foi.
 */
export function TabLinks({
  tabs,
  active,
  className,
}: {
  tabs: { key: string; label: string; href: string; icon?: React.ReactNode; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <nav
      className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}
      aria-label="Sections de la fiche"
    >
      {tabs.map((tab) => {
        const current = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            scroll={false}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              current
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
