"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Undo2, Trash2 } from "lucide-react";
import { setResult, setAssessmentStatus, deleteAssessment } from "@/actions/assessments";
import { LEVEL_LABELS } from "@/lib/constants";

type Candidate = { profileId: string; name: string };
type Result = {
  studentProfileId: string;
  score: number;
  comment: string | null;
  resultingLevel: string | null;
};

export function GradingPanel({
  assessmentId,
  maxScore,
  status,
  type,
  candidates,
  results,
}: {
  assessmentId: string;
  maxScore: number;
  status: "draft" | "published";
  type: string;
  candidates: Candidate[];
  results: Result[];
}) {
  const router = useRouter();
  const byStudent = new Map(results.map((r) => [r.studentProfileId, r]));

  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(
      candidates.map((c) => [
        c.profileId,
        byStudent.get(c.profileId)?.score?.toString() ?? "",
      ])
    )
  );
  const [levels, setLevels] = useState<Record<string, string>>(
    Object.fromEntries(
      candidates.map((c) => [c.profileId, byStudent.get(c.profileId)?.resultingLevel ?? ""])
    )
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(profileId: string) {
    setPending(profileId);
    setError(null);

    const raw = scores[profileId];
    const score = raw === "" ? null : parseInt(raw, 10);

    const result = await setResult(assessmentId, profileId, score, {
      resultingLevel: levels[profileId]
        ? (levels[profileId] as "debutant" | "intermediaire" | "avance")
        : undefined,
    });

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(null);
  }

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending("global");
    setError(null);
    const result = await fn();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur inattendue.");
    }
    setPending(null);
    return result.success;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
          <span>Notes ({results.length}/{candidates.length})</span>
          <div className="flex gap-2">
            {status === "draft" ? (
              <>
                <Button
                  size="sm"
                  disabled={pending !== null}
                  onClick={() => run(() => setAssessmentStatus(assessmentId, "published"))}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={pending !== null}
                  onClick={async () => {
                    const done = await run(() => deleteAssessment(assessmentId));
                    if (done) router.push("/admin/assessments");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={pending !== null}
                onClick={() => run(() => setAssessmentStatus(assessmentId, "draft"))}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Repasser en brouillon
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune élève concernée par cette évaluation.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {candidates.map((candidate) => (
              <div
                key={candidate.profileId}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <span className="text-sm font-medium min-w-0 truncate">
                  {candidate.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {type === "placement" && (
                    <select
                      value={levels[candidate.profileId] ?? ""}
                      onChange={(e) =>
                        setLevels((prev) => ({ ...prev, [candidate.profileId]: e.target.value }))
                      }
                      className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                    >
                      <option value="">Niveau —</option>
                      {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )}
                  <Input
                    type="number"
                    min="0"
                    max={maxScore}
                    value={scores[candidate.profileId] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [candidate.profileId]: e.target.value }))
                    }
                    placeholder="—"
                    className="w-20 h-8 text-center"
                  />
                  <span className="text-xs text-muted-foreground">/{maxScore}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending === candidate.profileId}
                    onClick={() => save(candidate.profileId)}
                  >
                    {pending === candidate.profileId ? "..." : "Noter"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Laisser la case vide retire la note : l&apos;élève redevient non
          évaluée, ce qui n&apos;est pas un zéro.
        </p>
      </CardContent>
    </Card>
  );
}
