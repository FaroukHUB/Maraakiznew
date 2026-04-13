"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createResource } from "@/actions/resources";
import { Plus } from "lucide-react";

const resourceTypes = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Vidéo" },
  { value: "audio", label: "Audio" },
  { value: "slide", label: "Diapo" },
  { value: "link", label: "Lien" },
] as const;

export function AddResourceForm({
  programs,
  existingCategories,
}: {
  programs: { id: string; name: string }[];
  existingCategories: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("pdf");
  const [url, setUrl] = useState("");
  const [programId, setProgramId] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une ressource
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !url) return;
    setLoading(true);
    setError(null);

    const result = await createResource({
      title,
      description: description || undefined,
      type: type as "pdf" | "video" | "audio" | "link" | "slide",
      url,
      programId: programId || null,
      category: category || undefined,
      sortOrder: parseInt(sortOrder) || 0,
    });

    if (result.success) {
      setTitle("");
      setDescription("");
      setUrl("");
      setCategory("");
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Titre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Qaida Nourania — PDF complet"
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

          <div className="space-y-1">
            <Label className="text-xs">Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description courte..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
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
              <Label className="text-xs">Programme</Label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Tous les programmes</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Catégorie</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Qaida Nourania"
                list="categories"
              />
              <datalist id="categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ordre</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min="0"
              />
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
      </CardContent>
    </Card>
  );
}
