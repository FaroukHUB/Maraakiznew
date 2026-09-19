"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createSkill, updateSkill, moveSkill, deleteSkill } from "@/actions/skills";

type Skill = {
  id: string;
  unit: string | null;
  code: string | null;
  label: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

export function SkillsManager({
  programId,
  skills,
}: {
  programId: string;
  skills: Skill[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    const result = await fn();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur inattendue.");
    }
    setPending(false);
    return result.success;
  }

  async function handleAdd() {
    if (!label.trim()) return;
    const done = await run(() =>
      createSkill({
        programId,
        label,
        unit: unit || undefined,
        code: code || undefined,
      })
    );
    if (done) {
      setLabel("");
      setCode("");
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune compétence dans ce programme.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {skills.map((skill, index) => (
            <div
              key={skill.id}
              className={`flex items-start gap-3 py-2.5 ${
                skill.active ? "" : "opacity-50"
              }`}
            >
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => run(() => moveSkill(skill.id, "up"))}
                  disabled={pending || index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Monter"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => run(() => moveSkill(skill.id, "down"))}
                  disabled={pending || index === skills.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Descendre"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {skill.code && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {skill.code}
                    </span>
                  )}
                  <span className="text-sm font-medium">{skill.label}</span>
                  {!skill.active && (
                    <Badge variant="outline" className="text-xs">
                      Retirée
                    </Badge>
                  )}
                </div>
                {skill.unit && (
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.unit}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => updateSkill(skill.id, { active: !skill.active }))}
                  className="text-muted-foreground"
                  aria-label={skill.active ? "Retirer du référentiel" : "Remettre dans le référentiel"}
                  title={
                    skill.active
                      ? "Retirer du référentiel — les acquis déjà validés sont conservés"
                      : "Remettre dans le référentiel"
                  }
                >
                  {skill.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => deleteSkill(skill.id))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {adding ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Intitulé de la compétence"
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Bloc (ex : Lettres isolées)"
            />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code (ex : N1.3)"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={pending || !label.trim()}>
              {pending ? "Ajout..." : "Ajouter"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                setLabel("");
                setCode("");
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
          Ajouter une compétence
        </Button>
      )}
    </div>
  );
}
