"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSubscription } from "@/actions/subscriptions";

type Student = { profileId: string; name: string };
type Program = { id: string; name: string; slug: string; defaultSessionCount: number };

export function NewSubscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get("student") ?? "";

  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentProfileId, setStudentProfileId] = useState(preselectedStudent);
  const [programId, setProgramId] = useState("");
  const [sessionType, setSessionType] = useState("group");
  const [totalSessions, setTotalSessions] = useState("8");
  const [weeklyRhythm, setWeeklyRhythm] = useState("2");
  const [price, setPrice] = useState("");

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

  // Auto-fill session count from program defaults
  useEffect(() => {
    const prog = programs.find((p) => p.id === programId);
    if (prog) {
      setTotalSessions(prog.defaultSessionCount.toString());
    }
  }, [programId, programs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentProfileId || !programId || !price) return;
    setSubmitting(true);
    setError(null);

    const result = await createSubscription({
      studentProfileId,
      programId,
      sessionType: sessionType as "individual" | "group",
      totalSessions: parseInt(totalSessions),
      weeklyRhythm: parseInt(weeklyRhythm),
      priceCents: Math.round(parseFloat(price) * 100),
    });

    if (result.success) {
      router.push(`/admin/students/${studentProfileId}`);
      router.refresh();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Créer un forfait</h2>
        <p className="text-muted-foreground mt-1">
          Associer un pack de séances à une élève
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student */}
            <div className="space-y-2">
              <Label>Élève</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <select
                  value={studentProfileId}
                  onChange={(e) => setStudentProfileId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
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

            {/* Program */}
            <div className="space-y-2">
              <Label>Programme</Label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Sélectionner un programme</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type de séance</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sessionType"
                    value="group"
                    checked={sessionType === "group"}
                    onChange={() => setSessionType("group")}
                  />
                  Groupe
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sessionType"
                    value="individual"
                    checked={sessionType === "individual"}
                    onChange={() => setSessionType("individual")}
                  />
                  Individuel
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Sessions */}
              <div className="space-y-2">
                <Label>Nombre de séances</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(e.target.value)}
                  required
                />
              </div>

              {/* Rhythm */}
              <div className="space-y-2">
                <Label>Rythme / semaine</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={weeklyRhythm}
                  onChange={(e) => setWeeklyRhythm(e.target.value)}
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label>Prix (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="60.00"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Création..." : "Créer le forfait"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
