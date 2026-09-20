"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useNow } from "@/lib/use-now";
import { greetingFor, firstName } from "@/lib/greeting";
import { formatHijri, formatGregorian } from "@/lib/hijri";
import { cn } from "@/lib/utils";
import { Clock } from "./clock";
import { Ornament } from "./ornament";

export type HeroAction = {
  label: string;
  count: number;
  href: string;
  tone: "primary" | "warning" | "success" | "quran";
};

/**
 * Le bandeau d'accueil.
 *
 * ── Ce qu'il dit, dans cet ordre ──
 *
 * Le salam, le prénom, puis CE QUI ATTEND. Un tableau de bord qui salue
 * sans dire quoi faire ne sert qu'une fois. Les pastilles du bas ne sont
 * pas des statistiques : ce sont les files de travail non vides, et elles
 * disparaissent quand il n'y a rien. Ce commentaire fait foi.
 *
 * Le salam et le prénom ne dépendent pas de l'heure : ils sont rendus par
 * le serveur. Le vœu, la date et l'horloge en dépendent, donc ils
 * réservent leur place et se remplissent après hydratation — voir
 * `lib/use-now.ts`.
 */
export function GreetingHero({
  name,
  subtitle,
  actions,
}: {
  name: string | null | undefined;
  subtitle: string;
  actions: HeroAction[];
}) {
  const now = useNow();
  const greeting = now ? greetingFor(now) : null;
  const given = firstName(name);

  return (
    <section
      className="aurora grain glass glass-edge relative overflow-hidden rounded-3xl border border-border/60 px-6 py-7 sm:px-9 sm:py-9"
      style={
        {
          "--aurora-a": greeting?.aurora.a ?? "var(--primary)",
          "--aurora-b": greeting?.aurora.b ?? "var(--nourania)",
        } as React.CSSProperties
      }
    >
      {/* Motif en filigrane — décor, jamais lu à voix haute */}
      <Ornament className="pointer-events-none absolute -right-16 -top-20 hidden h-80 w-80 text-primary/[0.07] sm:block" />

      <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {/* `dir="rtl"` sur un bloc large alignerait le texte à DROITE du
              bloc, donc au milieu du bandeau. En ligne, il ne façonne que
              ses propres caractères et reste au début. */}
          <p className="rise" style={{ "--i": 0 } as React.CSSProperties}>
            <span
              dir="rtl"
              lang="ar"
              className="inline-block font-arabic text-2xl sm:text-3xl text-primary/80"
            >
              السَّلَامُ عَلَيْكُمْ
            </span>
          </p>

          <h1
            className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight rise"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Salam alaykoum
            {given && (
              <>
                ,{" "}
                <span className="bg-gradient-to-br from-primary via-primary to-nourania bg-clip-text text-transparent">
                  {given}
                </span>
              </>
            )}
          </h1>

          <p
            className="mt-2 text-sm text-muted-foreground rise"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            {subtitle}
          </p>

          {/* Vœu + date : dépendent de l'heure, place réservée */}
          <div className="mt-4 min-h-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
            {greeting && now ? (
              <>
                <span className="font-medium text-foreground">{greeting.wishFr}</span>
                <span dir="rtl" lang="ar" className="font-arabic text-primary/70">
                  {greeting.wishAr}
                </span>
                <span className="hidden text-border sm:inline" aria-hidden>
                  •
                </span>
                <span className="basis-full text-muted-foreground first-letter:uppercase sm:basis-auto">
                  {formatGregorian(now)}
                </span>
                <span className="hidden text-border sm:inline" aria-hidden>
                  •
                </span>
                <span dir="auto" className="text-primary/80">
                  {formatHijri(now)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Horloge */}
        <div
          className="shrink-0 rise"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div className="inline-flex flex-col items-start lg:items-end rounded-2xl border border-border/60 bg-card/60 px-5 py-3.5 backdrop-blur">
            <div className="min-h-[3rem] sm:min-h-[3.5rem] flex items-baseline">
              {now ? (
                <Clock now={now} size="lg" withSeconds />
              ) : (
                <span className="text-4xl sm:text-5xl font-semibold text-transparent select-none">
                  00:00
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Heure locale
            </p>
          </div>
        </div>
      </div>

      {/* Ce qui attend */}
      {actions.length > 0 && (
        <div className="relative z-10 mt-7 flex flex-wrap items-center gap-2">
          <span className="basis-full text-xs uppercase tracking-[0.18em] text-muted-foreground sm:basis-auto sm:mr-1">
            À traiter
          </span>
          {actions.map((action, index) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                "group rise inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
                "text-sm font-medium transition-colors",
                TONES[action.tone]
              )}
              style={{ "--i": 4 + index } as React.CSSProperties}
            >
              <span className="font-semibold tabular-nums">{action.count}</span>
              <span>{action.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

const TONES: Record<HeroAction["tone"], string> = {
  primary: "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
  warning:
    "border-warning/30 bg-warning/10 text-warning-foreground hover:bg-warning/20",
  success: "border-success/25 bg-success/10 text-success hover:bg-success/15",
  quran: "border-quran/25 bg-quran/10 text-quran hover:bg-quran/15",
};
