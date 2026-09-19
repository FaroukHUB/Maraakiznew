"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { createInvoice } from "@/actions/invoices";

type Student = { profileId: string; name: string };
type Line = { label: string; quantity: string; unitPrice: string };

function euros(line: Line): number {
  return (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
}

export function NewInvoiceForm() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentProfileId, setStudentProfileId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { label: "", quantity: "1", unitPrice: "" },
  ]);

  useEffect(() => {
    fetch("/api/admin/students-and-programs")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = lines.reduce((sum, line) => sum + euros(line), 0);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createInvoice({
      studentProfileId,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      lines: lines.map((line) => ({
        label: line.label,
        quantity: Number(line.quantity) || 0,
        unitPriceCents: Math.round((Number(line.unitPrice) || 0) * 100),
      })),
    });

    if (result.success) {
      router.push(result.id ? `/admin/invoices/${result.id}` : "/admin/invoices");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nouvelle facture</h2>
        <p className="text-muted-foreground mt-1">
          Elle est créée en brouillon. Son numéro lui sera attribué à
          l&apos;émission.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Élève</Label>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : (
                  <select
                    id="student"
                    value={studentProfileId}
                    onChange={(e) => setStudentProfileId(e.target.value)}
                    required
                    className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Sélectionner une élève</option>
                    {students.map((s) => (
                      <option key={s.profileId} value={s.profileId}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="due">Échéance</Label>
                <Input
                  id="due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Lignes</Label>
              {lines.map((line, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      value={line.label}
                      onChange={(e) => updateLine(index, "label", e.target.value)}
                      placeholder="Désignation"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, "quantity", e.target.value)}
                      placeholder="Qté"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                      placeholder="Prix €"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Retirer la ligne"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines((prev) => [...prev, { label: "", quantity: "1", unitPrice: "" }])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="flex justify-end text-sm">
              <span className="text-muted-foreground mr-3">Total</span>
              <span className="font-bold text-lg">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(total)}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !studentProfileId}>
                {pending ? "Création..." : "Créer le brouillon"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/invoices")}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
