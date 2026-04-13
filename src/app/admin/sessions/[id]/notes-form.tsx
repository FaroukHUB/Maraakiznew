"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSessionNotes } from "@/actions/sessions";

type ExistingNotes = {
  content: string | null;
  stopReference: string | null;
  homework: string | null;
};

export function NotesForm({
  sessionId,
  existingNotes,
}: {
  sessionId: string;
  existingNotes?: ExistingNotes;
}) {
  const router = useRouter();
  const [content, setContent] = useState(existingNotes?.content ?? "");
  const [stopReference, setStopReference] = useState(existingNotes?.stopReference ?? "");
  const [homework, setHomework] = useState(existingNotes?.homework ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await saveSessionNotes(sessionId, {
      content: content || undefined,
      stopReference: stopReference || undefined,
      homework: homework || undefined,
    });

    if (result.success) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Contenu du cours</Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ce qui a été vu, travaillé, révisé..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stopReference">Arrêt dans le support</Label>
        <Input
          id="stopReference"
          value={stopReference}
          onChange={(e) => setStopReference(e.target.value)}
          placeholder="Ex: Qaida Nourania, page 12, ligne 5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="homework">Devoirs</Label>
        <textarea
          id="homework"
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder="Exercices, révisions, écoute audio..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer les notes"}
        </Button>
        {saved && (
          <span className="text-sm text-success">Enregistré</span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
