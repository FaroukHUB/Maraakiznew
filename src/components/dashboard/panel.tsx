import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Un panneau du tableau de bord.
 *
 * Titre, sous-titre facultatif, et un seul lien d'action en haut à
 * droite. Un panneau qui propose trois actions ne dit plus laquelle est
 * la sienne.
 */
export function Panel({
  title,
  icon: Icon,
  subtitle,
  action,
  index = 0,
  className,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  action?: { label: string; href: string };
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rise glass rounded-2xl border border-border/70 p-5 sm:p-6",
        className
      )}
      style={{ "--i": index } as React.CSSProperties}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
