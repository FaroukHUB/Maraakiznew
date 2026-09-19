"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createGroup } from "@/actions/groups";
import { LEVEL_LABELS } from "@/lib/constants";

type Student = { profileId: string; name: string };
type Program = { id: string; name: string };

export function NewGroupForm() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [programId, setProgramId] = useState("");
  const [level, setLevel] = useState("");
  const [schedule, setSchedule] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/students-and-programs")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students ?? []);
        setPrograms(data.programs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleStudent(profileId: string) {
    setSelected((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await createGroup({
      name,
      programId: programId || undefined,
      level: (level || undefined) as "debutant" | "intermediaire" | "avance" | undefined,
      description: description || undefined,
      schedule: schedule || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      studentProfileIds: selected,
    });

    if (result.success) {
      router.push("/admin/groups");
      router.refresh();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  const overCapacity =
    capacity !== "" && selected.length > parseInt(capacity, 10);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Créer un groupe</h2>
        <p className="text-muted-foreground mt-1">
          Réunir les élèves qui apprennent ensemble
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du groupe</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nourania — Samedi matin"
                required
              />
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
                <Label htmlFor="level">Niveau</Label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">—</option>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule">Créneau habituel</Label>
                <Input
                  id="schedule"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Samedi 10h-12h"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Illimitée"
                />
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

            <div className="space-y-2">
              <Label>
                Élèves{" "}
                <span className="font-normal text-muted-foreground">
                  ({selected.length} sélectionnée{selected.length > 1 ? "s" : ""})
                </span>
              </Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune élève enregistrée.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-md border border-input divide-y divide-border">
                  {students.map((student) => (
                    <label
                      key={student.profileId}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(student.profileId)}
                        onChange={() => toggleStudent(student.profileId)}
                        className="rounded"
                      />
                      <span className="text-sm">{student.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {overCapacity && (
                <p className="text-sm text-destructive">
                  {selected.length} élèves sélectionnées pour {capacity} places.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting || !name.trim() || overCapacity}>
                {submitting ? "Création..." : "Créer le groupe"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/groups")}
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
