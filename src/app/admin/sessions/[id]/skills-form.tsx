"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Check, Circle, CircleDot } from "lucide-react";
import { setSkillStatus } from "@/actions/skills";
import type { SkillWithStatus } from "@/data/skills";

const STATUS_ORDER = ["not_started", "in_progress", "acquired"] as const;

const STATUS_META: Record<
  SkillWithStatus["status"],
  { label: string; className: string; icon: typeof Circle }
> = {
  not_started: { label: "Non commencée", className: "text-muted-foreground", icon: Circle },
  in_progress: { label: "En cours", className: "text-warning-foreground", icon: CircleDot },
  acquired: { label: "Acquise", className: "text-success", icon: Check },
};

export function SkillsForm({
  sessionId,
  studentProfileId,
  studentName,
  programName,
  skills,
}: {
  sessionId: string;
  studentProfileId: string;
  studentName: string;
  programName: string;
  skills: SkillWithStatus[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voir progress-section.tsx : router.refresh() est asynchrone, on garde
  // le dernier statut choisi pour que le cycle reparte de la bonne valeur.
  const [pendingStatus, setPendingStatus] = useState<
    Record<string, SkillWithStatus["status"]>
  >({});

  const statusOf = (skill: SkillWithStatus) => pendingStatus[skill.id] ?? skill.status;

  async function cycleStatus(skill: SkillWithStatus) {
    const current = statusOf(skill);
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % 3];
    setPending(skill.id);
    setError(null);
    setPendingStatus((prev) => ({ ...prev, [skill.id]: next }));

    const result = await setSkillStatus(studentProfileId, skill.id, next, sessionId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
      setPendingStatus((prev) => ({ ...prev, [skill.id]: current }));
    }
    setPending(null);
  }

  if (skills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune compétence au référentiel de {programName}.{" "}
        <Link href="/admin/skills" className="text-primary hover:underline">
          Compléter le référentiel
        </Link>
      </p>
    );
  }

  const acquired = skills.filter((s) => statusOf(s) === "acquired").length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {acquired}/{skills.length} compétences acquises par {studentName}. Valider
        ici rattache l&apos;acquis à cette séance.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border border-border divide-y divide-border max-h-96 overflow-y-auto">
        {skills.map((skill) => {
          const meta = STATUS_META[statusOf(skill)];
          const Icon = meta.icon;
          return (
            <button
              key={skill.id}
              onClick={() => cycleStatus(skill)}
              disabled={pending === skill.id}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-accent/30 disabled:opacity-50"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${meta.className}`} />
                <span className="min-w-0">
                  <span className="text-sm block truncate">
                    {skill.code && (
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">
                        {skill.code}
                      </span>
                    )}
                    {skill.label}
                  </span>
                  {skill.unit && (
                    <span className="text-xs text-muted-foreground">{skill.unit}</span>
                  )}
                </span>
              </span>
              <Badge variant="outline" className={`text-xs shrink-0 ${meta.className}`}>
                {meta.label}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
