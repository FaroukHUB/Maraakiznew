"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Check, Circle, CircleDot, ChevronDown, ChevronRight } from "lucide-react";
import { setSkillStatus } from "@/actions/skills";
import type { ProgramProgress, SkillWithStatus } from "@/data/skills";

type ProgramBlock = ProgramProgress & { skills: SkillWithStatus[] };

const STATUS_ORDER = ["not_started", "in_progress", "acquired"] as const;

const STATUS_META: Record<
  SkillWithStatus["status"],
  { label: string; className: string; icon: typeof Circle }
> = {
  not_started: {
    label: "Non commencée",
    className: "text-muted-foreground",
    icon: Circle,
  },
  in_progress: {
    label: "En cours",
    className: "text-warning-foreground",
    icon: CircleDot,
  },
  acquired: { label: "Acquise", className: "text-success", icon: Check },
};

function barColor(rate: number): string {
  if (rate >= 75) return "bg-success";
  if (rate >= 40) return "bg-warning";
  return "bg-primary";
}

export function ProgressSection({
  studentProfileId,
  programs,
}: {
  studentProfileId: string;
  programs: ProgramBlock[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Statut choisi localement, le temps que router.refresh() ramène les
  // nouvelles props. Sans ça, deux clics rapprochés sur la même
  // compétence repartent du statut périmé et réécrivent la même valeur.
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

    const result = await setSkillStatus(studentProfileId, skill.id, next);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
      setPendingStatus((prev) => ({ ...prev, [skill.id]: current }));
    }
    setPending(null);
  }

  if (programs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun programme suivi pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {programs.map((program) => {
        const isOpen = open === program.programId;
        return (
          <div key={program.programId}>
            <button
              onClick={() => setOpen(isOpen ? null : program.programId)}
              className="w-full text-left"
              disabled={program.total === 0}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {program.total > 0 &&
                    (isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ))}
                  {program.programName}
                </span>
                <span className="text-sm font-bold">
                  {program.total > 0 ? `${program.rate}%` : "—"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor(program.rate)}`}
                  style={{ width: `${program.rate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {program.total === 0
                  ? "Aucune compétence au référentiel de ce programme"
                  : `${program.acquired}/${program.total} acquises${
                      program.inProgress > 0 ? `, ${program.inProgress} en cours` : ""
                    }`}
              </p>
            </button>

            {isOpen && program.skills.length > 0 && (
              <div className="mt-3 rounded-lg border border-border divide-y divide-border">
                {program.skills.map((skill) => {
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
                            <span className="text-xs text-muted-foreground">
                              {skill.unit}
                            </span>
                          )}
                        </span>
                      </span>
                      <Badge variant="outline" className={`text-xs shrink-0 ${meta.className}`}>
                        {meta.label}
                      </Badge>
                    </button>
                  );
                })}
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Cliquez sur une compétence pour la faire passer de non
                  commencée à en cours, puis acquise.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
