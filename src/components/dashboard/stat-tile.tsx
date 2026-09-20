import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "primary" | "quran" | "nourania" | "success" | "warning" | "destructive";

/**
 * Une tuile de chiffre.
 *
 * ── Deux partis pris ──
 *
 * 1. Le chiffre est rendu par le SERVEUR, en texte. Les animations sont
 *    entièrement en CSS : si elles ne se jouent pas, la tuile reste
 *    juste et lisible. Un compteur qui s'anime en JavaScript affiche zéro
 *    tant qu'il n'a pas démarré — c'est un chiffre faux.
 * 2. Une tuile qui mène quelque part EST un lien. Afficher « 3 paiements
 *    en attente » sans pouvoir cliquer oblige à retrouver la page à la
 *    main. Ce commentaire fait foi.
 */
export function StatTile({
  label,
  value,
  suffix,
  hint,
  href,
  icon: Icon,
  tone = "primary",
  ratio,
  index = 0,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  href?: string;
  icon: LucideIcon;
  tone?: Tone;
  /** 0 à 100 : dessine l'anneau. Absent, pas d'anneau. */
  ratio?: number;
  index?: number;
}) {
  const content = (
    <div
      className={cn(
        "tile rise glass h-full rounded-2xl border border-border/70 p-5",
        "flex items-start gap-4"
      )}
      style={
        {
          "--tile": TONE_VAR[tone],
          "--i": index,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          TONE_CHIP[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums leading-none">{value}</span>
          {suffix && (
            <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
          )}
        </p>
        {hint && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{hint}</p>
        )}
      </div>

      {ratio !== undefined && <Ring ratio={ratio} tone={tone} index={index} />}

      {href && (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="group block h-full">
      {content}
    </Link>
  );
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Ring({ ratio, tone, index }: { ratio: number; tone: Tone; index: number }) {
  const clamped = Math.max(0, Math.min(100, ratio));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-12 w-12 shrink-0 -rotate-90", TONE_TEXT[tone])}
      aria-hidden
    >
      <circle
        className="ring-track"
        cx="24"
        cy="24"
        r={RADIUS}
        fill="none"
        strokeWidth="4"
      />
      <circle
        className="ring-value"
        cx="24"
        cy="24"
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        style={
          {
            "--circumference": CIRCUMFERENCE,
            "--offset": offset,
            "--i": index,
          } as React.CSSProperties
        }
      />
    </svg>
  );
}

const TONE_VAR: Record<Tone, string> = {
  primary: "var(--primary)",
  quran: "var(--quran)",
  nourania: "var(--nourania)",
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
};

const TONE_CHIP: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  quran: "bg-quran/10 text-quran",
  nourania: "bg-nourania/15 text-nourania-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

const TONE_TEXT: Record<Tone, string> = {
  primary: "text-primary",
  quran: "text-quran",
  nourania: "text-nourania-foreground",
  success: "text-success",
  warning: "text-warning-foreground",
  destructive: "text-destructive",
};
