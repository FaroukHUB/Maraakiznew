"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { createDocument } from "@/actions/documents";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";

type Student = { profileId: string; name: string };

export function DocumentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("contract");
  const [studentProfileId, setStudentProfileId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [signedOn, setSignedOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  useEffect(() => {
    if (!open || students.length > 0) return;
    fetch("/api/admin/students-and-programs")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => undefined);
  }, [open, students.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createDocument({
      title,
      type: type as "contract" | "authorization" | "identity" | "medical" | "other",
      studentProfileId: studentProfileId || undefined,
      fileUrl: fileUrl || undefined,
      signedOn: signedOn || undefined,
      expiresOn: expiresOn || undefined,
    });

    if (result.success) {
      setTitle("");
      setFileUrl("");
      setSignedOn("");
      setExpiresOn("");
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Enregistrer un document
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contrat d'inscription 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student">Élève concernée</Label>
            <select
              id="student"
              value={studentProfileId}
              onChange={(e) => setStudentProfileId(e.target.value)}
              className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Document de l&apos;institut</option>
              {students.map((s) => (
                <option key={s.profileId} value={s.profileId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Lien vers le fichier</Label>
            <Input
              id="url"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Le fichier reste là où il est. L&apos;application n&apos;en garde
              que le lien.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signed">Signé le</Label>
              <Input
                id="signed"
                type="date"
                value={signedOn}
                onChange={(e) => setSignedOn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Échéance</Label>
              <Input
                id="expires"
                type="date"
                value={expiresOn}
                onChange={(e) => setExpiresOn(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
