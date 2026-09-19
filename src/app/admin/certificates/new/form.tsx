"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createCertificate } from "@/actions/certificates";

type Student = { profileId: string; name: string };
type Program = { id: string; name: string };

export function NewCertificateForm() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentProfileId, setStudentProfileId] = useState("");
  const [programId, setProgramId] = useState("");
  const [title, setTitle] = useState("Attestation de réussite");
  const [comment, setComment] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createCertificate({
      studentProfileId,
      title,
      programId: programId || undefined,
      comment: comment || undefined,
    });

    if (result.success) {
      router.push(result.id ? `/admin/certificates/${result.id}` : "/admin/certificates");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Préparer un diplôme</h2>
        <p className="text-muted-foreground mt-1">
          Les justificatifs — compétences, évaluations, assiduité — sont repris
          automatiquement et figés à la délivrance.
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Intitulé</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Programme</Label>
                <select
                  id="program"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Tous programmes</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Mot de l&apos;enseignante</Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !studentProfileId}>
                {pending ? "Préparation..." : "Préparer le diplôme"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/certificates")}
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
