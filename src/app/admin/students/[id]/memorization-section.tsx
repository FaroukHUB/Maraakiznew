"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, AlarmClock } from "lucide-react";
import { SURAHS, getSurah, formatPortion } from "@/lib/quran";
import {
  addMemorizationItem,
  deactivateMemorizationItem,
} from "@/actions/memorization";
import { ReviewButtons } from "@/app/admin/memorization/review-buttons";
import { formatDayMonthYear } from "@/lib/datetime";

type Item = {
  id: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
  intervalIndex: number;
  daysOverdue: number;
};


export function MemorizationSection({
  studentProfileId,
  items,
  totalAyahs,
  timeZone,
}: {
  studentProfileId: string;
  items: Item[];
  totalAyahs: number;
  timeZone: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [surahNumber, setSurahNumber] = useState("1");
  const [ayahStart, setAyahStart] = useState("1");
  const [ayahEnd, setAyahEnd] = useState("7");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const surah = getSurah(parseInt(surahNumber, 10));

  function handleSurahChange(value: string) {
    setSurahNumber(value);
    const next = getSurah(parseInt(value, 10));
    setAyahStart("1");
    setAyahEnd(String(next?.ayahCount ?? 1));
  }

  async function handleAdd() {
    setPending(true);
    setError(null);

    const result = await addMemorizationItem({
      studentProfileId,
      surahNumber: parseInt(surahNumber, 10),
      ayahStart: parseInt(ayahStart, 10),
      ayahEnd: parseInt(ayahEnd, 10),
    });

    if (result.success) {
      setAdding(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  async function handleRemove(itemId: string) {
    setPending(true);
    setError(null);

    const result = await deactivateMemorizationItem(itemId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {items.length === 0
          ? "Aucune portion enregistrée."
          : `${items.length} portion${items.length > 1 ? "s" : ""} — ${totalAyahs} verset${
              totalAyahs > 1 ? "s" : ""
            } mémorisé${totalAyahs > 1 ? "s" : ""}`}
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length > 0 && (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {formatPortion(item.surahNumber, item.ayahStart, item.ayahEnd)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {item.daysOverdue >= 0 ? (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        item.daysOverdue > 7
                          ? "text-destructive border-destructive/30"
                          : "text-warning-foreground border-warning/30"
                      }`}
                    >
                      <AlarmClock className="h-3 w-3 mr-1" />
                      À réviser
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Prochaine révision le {formatDayMonthYear(item.nextReviewAt, timeZone)}
                    </span>
                  )}
                  {item.lastReviewedAt && (
                    <span className="text-xs text-muted-foreground">
                      · révisée le {formatDayMonthYear(item.lastReviewedAt, timeZone)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ReviewButtons itemId={item.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleRemove(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Retirer du cycle de révision"
                  title="Retirer du cycle — l'historique est conservé"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-2">
            <Label htmlFor="surah">Sourate</Label>
            <select
              id="surah"
              value={surahNumber}
              onChange={(e) => handleSurahChange(e.target.value)}
              className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
            >
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.ayahCount} versets)
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Du verset</Label>
              <Input
                id="start"
                type="number"
                min="1"
                max={surah?.ayahCount ?? 1}
                value={ayahStart}
                onChange={(e) => setAyahStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Au verset</Label>
              <Input
                id="end"
                type="number"
                min="1"
                max={surah?.ayahCount ?? 1}
                value={ayahEnd}
                onChange={(e) => setAyahEnd(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            La première révision est programmée dès le lendemain.
          </p>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={pending}>
              {pending ? "Ajout..." : "Ajouter la portion"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une portion
        </Button>
      )}
    </div>
  );
}
