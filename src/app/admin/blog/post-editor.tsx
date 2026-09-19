"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Undo2, Trash2, Pin } from "lucide-react";
import { createPost, updatePost, setPostStatus, deletePost } from "@/actions/posts";

export function PostEditor({
  post,
}: {
  post?: {
    id: string;
    title: string;
    category: string | null;
    excerpt: string | null;
    content: string;
    status: "draft" | "published";
    pinned: boolean;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
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
    return result;
  }

  async function handleSave() {
    if (post) {
      const r = await run(() =>
        updatePost(post.id, {
          title,
          content,
          category: category || null,
          excerpt: excerpt || null,
        })
      );
      if (r.success) setSaved(true);
    } else {
      const r = await run(() =>
        createPost({ title, content, category: category || undefined, excerpt: excerpt || undefined })
      );
      if (r.success && "id" in r && r.id) router.push(`/admin/blog/${r.id}`);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reprise des cours après les vacances"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Annonce, Conseil, Organisation..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Résumé</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Une phrase qui donne envie de lire"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Contenu</Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-normal leading-relaxed"
            placeholder="Les paragraphes sont séparés par une ligne vide."
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={pending || !title.trim() || !content.trim()} onClick={handleSave}>
            {pending ? "Enregistrement..." : post ? "Enregistrer" : "Créer le brouillon"}
          </Button>
          {saved && <span className="text-sm text-success">Enregistré</span>}

          {post && (
            <>
              {post.status === "draft" ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => setPostStatus(post.id, "published"))}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => setPostStatus(post.id, "draft"))}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Dépublier
                </Button>
              )}
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(() => updatePost(post.id, { pinned: !post.pinned }))}
                title="Un article épinglé reste en tête de liste"
              >
                <Pin className="h-4 w-4 mr-2" />
                {post.pinned ? "Désépingler" : "Épingler"}
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                disabled={pending}
                onClick={async () => {
                  const r = await run(() => deletePost(post.id));
                  if (r.success) router.push("/admin/blog");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
