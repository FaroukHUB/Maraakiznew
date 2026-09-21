"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createGroup, updateGroup } from "@/actions/groups";
import { LEVEL_LABELS } from "@/lib/constants";

export type GroupValues = {
  id?: string;
  name: string;
  programId: string;
  staffMemberId: string;
  level: string;
  schedule: string;
  capacity: string;
  description: string;
  status: "active" | "archived";
};

const EMPTY: GroupValues = {
  name: "",
  programId: "",
  staffMemberId: "",
  level: "",
  schedule: "",
  capacity: "",
  description: "",
  status: "active",
};

/**
 * Créer ou modifier un groupe, en modale.
 *
 * ── Pourquoi les élèves ne sont PAS dans cette modale ──
 *
 * Choisir les membres, c'est parcourir une liste : une modale n'en
 * contient jamais (voir `components/ui/dialog.tsx`). Le groupe se crée
 * donc vide, et l'on arrive sur sa fiche, où la liste a sa place et où
 * l'on voit ce qu'on fait — l'effectif, la capacité, qui est déjà là.
 * Ce commentaire fait foi.
 */
export function GroupDialog({
  programs,
  teachers,
  initial,
  trigger,
  onDone,
}: {
  programs: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  initial?: GroupValues;
  /** Élément à FUSIONNER avec le déclencheur. Jamais un enfant. */
  trigger?: React.ReactElement;
  onDone?: "fiche" | "stay";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<GroupValues>(initial ?? EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = Boolean(initial?.id);

  function set<K extends keyof GroupValues>(key: K, value: GroupValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(initial ?? EMPTY);
      setError(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const capacity = values.capacity.trim()
      ? Number.parseInt(values.capacity, 10)
      : undefined;
    if (capacity !== undefined && (Number.isNaN(capacity) || capacity < 1)) {
      setError("La capacité doit être un nombre de places, ou rester vide.");
      setPending(false);
      return;
    }

    const level = (values.level || undefined) as
      | "debutant"
      | "intermediaire"
      | "avance"
      | undefined;

    const result = initial?.id
      ? await updateGroup(initial.id, {
          name: values.name,
          programId: values.programId || null,
          staffMemberId: values.staffMemberId || null,
          level: level ?? null,
          schedule: values.schedule || null,
          capacity: capacity ?? null,
          description: values.description || null,
          status: values.status,
        })
      : await createGroup({
          name: values.name,
          programId: values.programId || undefined,
          staffMemberId: values.staffMemberId || undefined,
          level,
          schedule: values.schedule || undefined,
          capacity,
          description: values.description || undefined,
        });

    if (result.success) {
      setOpen(false);
      if (!initial?.id && onDone === "fiche" && "id" in result && result.id) {
        router.push(`/admin/groups/${result.id}`);
      }
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        `render` FUSIONNE le déclencheur avec l'élément fourni. Le passer
        en enfant ferait un <button> dans un <button> : HTML invalide, et
        l'hydratation échoue. Ce commentaire fait foi.
      */}
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un groupe
            </Button>
          )
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier le groupe" : "Créer un groupe"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Les modifications prennent effet immédiatement."
              : "Le groupe se crée vide : les élèves s'ajoutent ensuite depuis sa fiche."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="groupe-nom">Nom</Label>
            <Input
              id="groupe-nom"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nourania — Débutantes du mardi"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="groupe-programme">Programme</Label>
              <select
                id="groupe-programme"
                value={values.programId}
                onChange={(e) => set("programId", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Aucun</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="groupe-enseignante">Enseignante</Label>
              <select
                id="groupe-enseignante"
                value={values.staffMemberId}
                onChange={(e) => set("staffMemberId", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pas encore attribué</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="groupe-niveau">Niveau</Label>
              <select
                id="groupe-niveau"
                value={values.level}
                onChange={(e) => set("level", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Tous niveaux</option>
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="groupe-capacite">Capacité</Label>
              <Input
                id="groupe-capacite"
                inputMode="numeric"
                value={values.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                placeholder="Illimitée"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="groupe-creneau">Créneau habituel</Label>
            <Input
              id="groupe-creneau"
              value={values.schedule}
              onChange={(e) => set("schedule", e.target.value)}
              placeholder="Samedi 10h-12h"
            />
            <p className="text-xs text-muted-foreground">
              Un repère écrit, pas une règle de récurrence : chaque séance reste
              planifiée une par une.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="groupe-description">Description</Label>
            <textarea
              id="groupe-description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {editing && (
            <div className="space-y-1.5">
              <Label htmlFor="groupe-statut">Statut</Label>
              <select
                id="groupe-statut"
                value={values.status}
                onChange={(e) => set("status", e.target.value as GroupValues["status"])}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Actif</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Le déclencheur de la modale de modification, sur la fiche. */
export function EditGroupButton(props: {
  programs: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  initial: GroupValues;
}) {
  return (
    <GroupDialog
      {...props}
      trigger={
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Modifier
        </Button>
      }
    />
  );
}
