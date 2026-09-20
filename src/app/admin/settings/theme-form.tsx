"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateSettings } from "@/actions/settings";
import { deriveTheme, THEME_PRESETS } from "@/lib/theme";
import { parseHex } from "@/lib/color";

/**
 * Les deux couleurs de l'institut.
 *
 * ── L'aperçu est le vrai thème ──
 *
 * Il ne peint pas des carrés décoratifs : il applique les jetons
 * réellement dérivés à de vrais éléments — un bouton, une pastille, une
 * carte, un texte atténué. Ce qu'on voit est ce qu'on aura.
 *
 * Et quand une couleur a dû être corrigée pour rester lisible, on le
 * DIT. Corriger en douce laisserait croire que le choix n'a pas été pris
 * en compte. Ce commentaire fait foi.
 */
export function ThemeForm({
  current,
}: {
  current: { primary: string; accent: string };
}) {
  const router = useRouter();
  const [primary, setPrimary] = useState(current.primary);
  const [accent, setAccent] = useState(current.accent);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = parseHex(primary) !== null && parseHex(accent) !== null;
  const { tokens, adjustments } = deriveTheme(primary, accent);

  function choose(nextPrimary: string, nextAccent: string) {
    setPrimary(nextPrimary);
    setAccent(nextAccent);
    setSaved(false);
  }

  async function save() {
    setPending(true);
    setError(null);
    const result = await updateSettings({ themePrimary: primary, themeAccent: accent });
    if (result.success) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  const activePreset = THEME_PRESETS.find(
    (p) => p.primary.toLowerCase() === primary.toLowerCase() &&
      p.accent.toLowerCase() === accent.toLowerCase()
  );

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Palettes prêtes
          </Label>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => choose(preset.primary, preset.accent)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  activePreset?.id === preset.id
                    ? "border-foreground/40 bg-accent"
                    : "border-border hover:bg-accent/40"
                )}
              >
                <span className="flex">
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ background: preset.primary }}
                  />
                  <span
                    className="-ml-1.5 h-4 w-4 rounded-full border border-black/10"
                    style={{ background: preset.accent }}
                  />
                </span>
                {preset.label}
                {activePreset?.id === preset.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            id="themePrimary"
            label="Couleur principale"
            hint="Boutons, liens, élément actif"
            value={primary}
            onChange={(v) => { setPrimary(v); setSaved(false); }}
          />
          <ColorField
            id="themeAccent"
            label="Seconde couleur"
            hint="Accents, dégradés, mises en valeur"
            value={accent}
            onChange={(v) => { setAccent(v); setSaved(false); }}
          />
        </div>

        {/* L'aperçu applique les jetons réellement dérivés */}
        <div
          className="rounded-xl border p-4"
          style={{
            background: tokens["--background"],
            borderColor: tokens["--border"],
            color: tokens["--foreground"],
          }}
        >
          <p className="text-xs uppercase tracking-wide" style={{ color: tokens["--muted-foreground"] }}>
            Aperçu
          </p>
          <div
            className="mt-3 rounded-xl border p-3"
            style={{ background: tokens["--card"], borderColor: tokens["--border"] }}
          >
            <p className="text-sm font-semibold">Assiduité ce mois</p>
            <p className="text-2xl font-bold" style={{ color: tokens["--primary"] }}>
              95 %
            </p>
            <p className="text-xs" style={{ color: tokens["--muted-foreground"] }}>
              20 séances sans appel
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-lg px-3 py-1.5 text-sm font-medium"
                style={{ background: tokens["--primary"], color: tokens["--primary-foreground"] }}
              >
                Enregistrer
              </span>
              <span
                className="rounded-full px-3 py-1 text-sm"
                style={{ background: tokens["--accent"], color: tokens["--accent-foreground"] }}
              >
                3 révisions dues
              </span>
              <span className="text-sm" style={{ color: tokens["--primary"] }}>
                Voir les détails
              </span>
            </div>
          </div>
        </div>

        {adjustments.length > 0 && (
          <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs">
            <Info className="h-4 w-4 shrink-0 text-warning-foreground" />
            <div>
              <p className="font-medium text-warning-foreground">
                Ajusté pour rester lisible
              </p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {adjustments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Le vert, l&apos;ambre et le rouge ne se personnalisent pas : ils
          disent « c&apos;est bon », « attention » et « il y a un
          problème ». Les élèves voient les mêmes couleurs que vous.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending || !valid}>
            <Palette className="mr-2 h-4 w-4" />
            {pending ? "Enregistrement..." : "Appliquer"}
          </Button>
          {saved && <span className="text-sm text-success">Appliqué.</span>}
          {!valid && (
            <span className="text-sm text-destructive">
              Couleur invalide.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={parseHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
