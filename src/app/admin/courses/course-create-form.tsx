"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { createCourse } from "@/actions/courses";

export function CourseCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Créer un cours
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du cours"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={pending || !title.trim()}
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await createCourse({ title });
              if (result.success) {
                router.push(result.id ? `/admin/courses/${result.id}` : "/admin/courses");
                router.refresh();
              } else {
                setError(result.error);
                setPending(false);
              }
            }}
          >
            {pending ? "Création..." : "Créer"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
