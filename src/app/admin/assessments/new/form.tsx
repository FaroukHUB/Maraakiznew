"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createAssessment } from "@/actions/assessments";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/constants";

type Program = { id: string; name: string };

export function NewAssessmentForm({
  groups,
}: {
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"quiz" | "exam" | "placement" | "contest">("quiz");
  const [maxScore, setMaxScore] = useState("20");
  const [heldOn, setHeldOn] = useState(new Date().toISOString().slice(0, 10));
  const [programId, setProgramId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/admin/students-and-programs")
      .then((r) => r.json())
      .then((data) => setPrograms(data.programs ?? []))
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createAssessment({
      title,
      type,
      maxScore: parseInt(maxScore, 10),
      heldOn,
      programId: programId || undefined,
      groupId: groupId || undefined,
      description: description || undefined,
    });

    if (result.success) {
      router.push(result.id ? `/admin/assessments/${result.id}` : "/admin/assessments");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nouvelle évaluation</h2>
        <p className="text-muted-foreground mt-1">
          Elle est créée en brouillon : vous pourrez saisir les notes avant de
          la publier aux élèves.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contrôle des lettres isolées"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                >
                  {Object.entries(ASSESSMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Barème</Label>
                <Input
                  id="max"
                  type="number"
                  min="1"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={heldOn}
                  onChange={(e) => setHeldOn(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="program">Programme</Label>
                <select
                  id="program"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">—</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">Groupe</Label>
                <select
                  id="group"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Toutes les élèves</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !title.trim()}>
                {pending ? "Création..." : "Créer l'évaluation"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/assessments")}
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
