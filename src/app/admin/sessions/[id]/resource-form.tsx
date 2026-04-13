"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSessionResource } from "@/actions/sessions";
import { Plus } from "lucide-react";

const resourceTypes = [
  { value: "replay_video", label: "Replay vidéo" },
  { value: "slide", label: "Diapo" },
  { value: "summary", label: "Synthèse" },
  { value: "exercise", label: "Exercice" },
  { value: "link", label: "Lien" },
] as const;

export function ResourceForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>("link");
  const [visibleTo, setVisibleTo] = useState<string>("participants_only");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !url) return;
    setLoading(true);
    setError(null);

    const result = await addSessionResource(sessionId, {
      title,
      type: type as "replay_video" | "slide" | "summary" | "exercise" | "link",
      url,
      visibleTo: visibleTo as "all" | "participants_only",
    });

    if (result.success) {
      setTitle("");
      setUrl("");
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une ressource
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-border">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Titre</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Replay séance 5"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
          >
            {resourceTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Visible par</Label>
          <select
            value={visibleTo}
            onChange={(e) => setVisibleTo(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
          >
            <option value="participants_only">Participantes uniquement</option>
            <option value="all">Toutes les élèves</option>
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Ajout..." : "Ajouter"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
