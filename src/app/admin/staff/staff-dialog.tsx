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
import { createStaffMember, updateStaffMember } from "@/actions/staff";
import { STAFF_ROLE_LABELS } from "@/lib/constants";

type StaffRole = "teacher" | "secretary" | "supervisor" | "pedagogical_lead" | "manager";

export type StaffValues = {
  id?: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  status: "active" | "inactive";
  mode: "hourly" | "monthly" | "none";
  rate: string;
  supervisorId: string;
  notes: string;
};

const EMPTY: StaffValues = {
  name: "",
  role: "teacher",
  email: "",
  phone: "",
  status: "active",
  mode: "hourly",
  rate: "",
  supervisorId: "",
  notes: "",
};

/**
 * Ajouter ou modifier une enseignante, en modale.
 *
 * ── Un seul formulaire pour les deux ──
 *
 * Créer et modifier demandent les mêmes champs ; deux formulaires
 * finiraient par diverger, et l'un des deux oublierait un champ. La
 * présence d'un identifiant décide de l'action appelée, rien d'autre.
 * Ce commentaire fait foi.
 */
export function StaffDialog({
  supervisors,
  initial,
  trigger,
}: {
  supervisors: { id: string; name: string }[];
  initial?: StaffValues;
  /** Élément à fusionner avec le déclencheur. Pas un enfant : voir plus bas. */
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<StaffValues>(initial ?? EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = Boolean(initial?.id);

  function set<K extends keyof StaffValues>(key: K, value: StaffValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // À la réouverture, on repart des valeurs d'origine : une saisie
  // abandonnée ne doit pas réapparaître à la fois suivante.
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

    const amount = values.rate ? parseFloat(values.rate.replace(",", ".")) : undefined;
    const common = {
      name: values.name,
      role: values.role,
      email: values.email || undefined,
      phone: values.phone || undefined,
      hourlyRate: values.mode === "hourly" ? amount : undefined,
      monthlyRate: values.mode === "monthly" ? amount : undefined,
      supervisorId: values.supervisorId || undefined,
    };

    const result = initial?.id
      ? await updateStaffMember(initial.id, {
          ...common,
          status: values.status,
          email: values.email || null,
          phone: values.phone || null,
          notes: values.notes || null,
          // Un mode « non rémunérée » efface les deux tarifs : sans cela
          // un ancien tarif horaire resterait et continuerait à payer.
          hourlyRate: values.mode === "hourly" ? (amount ?? null) : null,
          monthlyRate: values.mode === "monthly" ? (amount ?? null) : null,
          supervisorId: values.supervisorId || null,
        })
      : await createStaffMember(common);

    if (result.success) {
      setOpen(false);
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
              Ajouter un enseignant
            </Button>
          )
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Modifier le profil" : "Ajouter un enseignant"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Les modifications prennent effet immédiatement."
              : "Un membre peut exister sans compte de connexion : l'institut suit des personnes, pas seulement des utilisatrices."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Nom</Label>
              <Input
                id="staff-name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-role">Rôle</Label>
              <select
                id="staff-role"
                value={values.role}
                onChange={(e) => set("role", e.target.value as StaffRole)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone">Téléphone</Label>
              <Input
                id="staff-phone"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-mode">Rémunération</Label>
              <select
                id="staff-mode"
                value={values.mode}
                onChange={(e) => set("mode", e.target.value as StaffValues["mode"])}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="hourly">Taux horaire</option>
                <option value="monthly">Forfait mensuel</option>
                <option value="none">Non rémunérée</option>
              </select>
            </div>
            {values.mode !== "none" && (
              <div className="space-y-1.5">
                <Label htmlFor="staff-rate">
                  Montant {values.mode === "hourly" ? "par heure" : "par mois"} (€)
                </Label>
                <Input
                  id="staff-rate"
                  inputMode="decimal"
                  value={values.rate}
                  onChange={(e) => set("rate", e.target.value)}
                  placeholder={values.mode === "hourly" ? "25" : "1800"}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-supervisor">Supervisée par</Label>
              <select
                id="staff-supervisor"
                value={values.supervisorId}
                onChange={(e) => set("supervisorId", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Personne</option>
                {supervisors
                  .filter((s) => s.id !== initial?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label htmlFor="staff-status">Statut</Label>
                <select
                  id="staff-status"
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as "active" | "inactive")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {editing && (
            <div className="space-y-1.5">
              <Label htmlFor="staff-notes">Notes internes</Label>
              <textarea
                id="staff-notes"
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Le déclencheur de la modale de modification, sur la fiche. */
export function EditStaffButton(props: {
  supervisors: { id: string; name: string }[];
  initial: StaffValues;
}) {
  return (
    <StaffDialog
      {...props}
      trigger={
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Modifier le profil
        </Button>
      }
    />
  );
}
