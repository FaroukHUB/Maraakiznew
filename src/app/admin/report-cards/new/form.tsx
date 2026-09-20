"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createReportCard } from "@/actions/report-cards";
import { formatMonth } from "@/lib/datetime";

type Student = { profileId: string; name: string };

/** Trimestre écoulé, comme période proposée par défaut. */
/**
 * La période proposée par défaut : les trois mois clos précédents.
 *
 * Le titre nomme les mois dans le fuseau de l'institut : c'est lui qui
 * définit le trimestre, pas le fuseau du navigateur de qui saisit.
 */
function defaultPeriod(timeZone: string): { start: string; end: string; title: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 0); // fin du mois dernier
  const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    start: iso(start),
    end: iso(end),
    title: `Bulletin — ${formatMonth(start, timeZone)} à ${formatMonth(end, timeZone)}`,
  };
}

export function NewReportCardForm({ timeZone }: { timeZone: string }) {
  const router = useRouter();
  const preset = defaultPeriod(timeZone);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentProfileId, setStudentProfileId] = useState("");
  const [title, setTitle] = useState(preset.title);
  const [periodStart, setPeriodStart] = useState(preset.start);
  const [periodEnd, setPeriodEnd] = useState(preset.end);

  useEffect(() => {
    fetch("/api/admin/students-and-programs")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentProfileId) return;
    setPending(true);
    setError(null);

    const result = await createReportCard({
      studentProfileId,
      title,
      periodStart,
      periodEnd,
    });

    if (result.success) {
      router.push(result.id ? `/admin/report-cards/${result.id}` : "/admin/report-cards");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Générer un bulletin</h2>
        <p className="text-muted-foreground mt-1">
          Les chiffres de la période sont relevés maintenant et figés dans le
          bulletin.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="student">Élève</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <select
                  id="student"
                  value={studentProfileId}
                  onChange={(e) => setStudentProfileId(e.target.value)}
                  required
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Sélectionner une élève</option>
                  {students.map((s) => (
                    <option key={s.profileId} value={s.profileId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Début de période</Label>
                <Input
                  id="start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fin de période</Label>
                <Input
                  id="end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !studentProfileId}>
                {pending ? "Génération..." : "Générer le bulletin"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/report-cards")}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
