"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createProspect } from "@/actions/prospects";
import { LEVEL_LABELS } from "@/lib/constants";

type Program = { id: string; name: string };

export function NewProspectForm() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [programId, setProgramId] = useState("");
  const [declaredLevel, setDeclaredLevel] = useState("");
  const [notes, setNotes] = useState("");

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

    const result = await createProspect({
      name,
      email: email || undefined,
      phone: phone || undefined,
      source: source || undefined,
      programId: programId || undefined,
      declaredLevel: declaredLevel
        ? (declaredLevel as "debutant" | "intermediaire" | "avance")
        : undefined,
      notes: notes || undefined,
    });

    if (result.success) {
      router.push(result.id ? `/admin/prospects/${result.id}` : "/admin/prospects");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nouveau prospect</h2>
        <p className="text-muted-foreground mt-1">
          Une demande reçue, avant toute inscription.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              L&apos;un des deux au moins, pour pouvoir recontacter.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="source">Origine</Label>
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Instagram, bouche-à-oreille..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Programme visé</Label>
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
                <Label htmlFor="level">Niveau annoncé</Label>
                <select
                  id="level"
                  value={declaredLevel}
                  onChange={(e) => setDeclaredLevel(e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !name.trim()}>
                {pending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/prospects")}
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
