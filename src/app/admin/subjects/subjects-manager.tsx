"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createSubject, updateSubject, deleteSubject } from "@/actions/subjects";

type Subject = {
  id: string;
  name: string;
  description: string | null;
  defaultSessionCount: number;
  active: boolean;
  subscriptionCount: number;
  skillCount: number;
};

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [sessionCount, setSessionCount] = useState("8");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    if (result.success) router.refresh();
    else setError(result.error ?? "Erreur inattendue.");
    setPending(false);
    return result.success;
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className={`flex items-center justify-between gap-3 py-3 ${
              subject.active ? "" : "opacity-50"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium flex items-center gap-2">
                {subject.name}
                {!subject.active && (
                  <Badge variant="outline" className="text-xs">
                    Retirée
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subject.defaultSessionCount} séances par forfait ·{" "}
                {subject.skillCount} compétence{subject.skillCount > 1 ? "s" : ""} ·{" "}
                {subject.subscriptionCount} forfait{subject.subscriptionCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                className="text-muted-foreground"
                aria-label={subject.active ? "Retirer des listes" : "Remettre dans les listes"}
                onClick={() => run(() => updateSubject(subject.id, { active: !subject.active }))}
              >
                {subject.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Supprimer"
                onClick={() => run(() => deleteSubject(subject.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {adding ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              className="sm:col-span-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la matière"
              autoFocus
            />
            <Input
              type="number"
              min="1"
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value)}
              placeholder="Séances"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending || !name.trim()}
              onClick={async () => {
                const done = await run(() =>
                  createSubject({
                    name,
                    defaultSessionCount: parseInt(sessionCount, 10),
                  })
                );
                if (done) {
                  setName("");
                  setAdding(false);
                }
              }}
            >
              Ajouter
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une matière
        </Button>
      )}
    </div>
  );
}
