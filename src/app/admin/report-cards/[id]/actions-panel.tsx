"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Send, Undo2, Trash2, Printer } from "lucide-react";
import {
  refreshReportCard,
  setReportCardStatus,
  updateReportCardComment,
  deleteReportCard,
} from "@/actions/report-cards";

export function ReportCardActions({
  id,
  status,
  generalComment,
}: {
  id: string;
  status: "draft" | "published";
  generalComment: string | null;
}) {
  const router = useRouter();
  const [comment, setComment] = useState(generalComment ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await fn();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur inattendue.");
    }
    setPending(false);
    return result.success;
  }

  return (
    <Card className="print:hidden">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium">
            Appréciation générale
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Le mot de l'enseignante, tel qu'il apparaîtra sur le bulletin."
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={pending}
              onClick={async () => {
                const done = await run(() => updateReportCardComment(id, comment));
                if (done) setSaved(true);
              }}
            >
              Enregistrer l&apos;appréciation
            </Button>
            {saved && <span className="text-sm text-success">Enregistré</span>}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          {status === "draft" ? (
            <>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => run(() => setReportCardStatus(id, "published"))}
              >
                <Send className="h-4 w-4 mr-2" />
                Publier à l&apos;élève
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => refreshReportCard(id))}
                title="Relève à nouveau les chiffres de la période"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculer
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                className="text-destructive"
                onClick={async () => {
                  const done = await run(() => deleteReportCard(id));
                  if (done) router.push("/admin/report-cards");
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => setReportCardStatus(id, "draft"))}
              title="Le bulletin disparaît de l'espace de l'élève"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Repasser en brouillon
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>

        {status === "published" && (
          <p className="text-xs text-muted-foreground">
            Ce bulletin est visible par l&apos;élève et ses chiffres sont figés.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
