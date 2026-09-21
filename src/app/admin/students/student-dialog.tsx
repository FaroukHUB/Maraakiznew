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
import {
  CountryTimezoneFields,
  type AddressValues,
} from "@/components/ui/country-timezone-fields";
import { createStudent, updateStudentProfile } from "@/actions/students";

export type StudentValues = {
  id?: string;
  name: string;
  email: string;
  password: string;
  birthDate: string;
  arabicReadingLevel: "debutant" | "intermediaire" | "avance";
  whatsappPhone: string;
  localPhone: string;
  paypalAddress: string;
  previousExperience: string;
  notes: string;
  address: AddressValues;
};

const EMPTY: StudentValues = {
  name: "",
  email: "",
  password: "",
  birthDate: "",
  arabicReadingLevel: "debutant",
  whatsappPhone: "",
  localPhone: "",
  paypalAddress: "",
  previousExperience: "",
  notes: "",
  address: { addressLine: "", postalCode: "", city: "", country: "", timezone: "" },
};

/**
 * Inscrire ou modifier une élève, en modale.
 *
 * ── Un seul formulaire pour les deux ──
 *
 * Inscrire et modifier demandent les mêmes champs, à une exception
 * près : le mot de passe initial, qui n'a de sens qu'à la création.
 * La présence d'un identifiant décide de l'action appelée.
 * Ce commentaire fait foi.
 */
export function StudentDialog({
  instituteZoneLabel,
  initial,
  trigger,
  onDone,
}: {
  instituteZoneLabel: string;
  initial?: StudentValues;
  /** Élément à FUSIONNER avec le déclencheur. Jamais un enfant. */
  trigger?: React.ReactElement;
  /** Où aller après une création réussie. */
  onDone?: "profile" | "stay";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<StudentValues>(initial ?? EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = Boolean(initial?.id);

  function set<K extends keyof StudentValues>(key: K, value: StudentValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // À la réouverture on repart des valeurs d'origine : une saisie
  // abandonnée ne doit pas réapparaître la fois suivante.
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

    const common = {
      name: values.name,
      email: values.email,
      whatsappPhone: values.whatsappPhone,
      localPhone: values.localPhone,
      paypalAddress: values.paypalAddress,
      arabicReadingLevel: values.arabicReadingLevel,
      birthDate: values.birthDate,
      previousExperience: values.previousExperience,
      notes: values.notes,
      ...values.address,
    };

    const result = initial?.id
      ? await updateStudentProfile(initial.id, common)
      : await createStudent({ ...common, password: values.password || "maraakiz" });

    if (result.success) {
      setOpen(false);
      if (!initial?.id && onDone === "profile" && "id" in result && result.id) {
        router.push(`/admin/students/${result.id}`);
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
              Ajouter une élève
            </Button>
          )
        }
      />

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier la fiche" : "Ajouter une élève"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Les modifications prennent effet immédiatement."
              : "Seuls le nom et l'email sont nécessaires : le reste se complète au fil des séances."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="student-name">Nom complet</Label>
              <Input
                id="student-name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-birth">Date de naissance</Label>
              <Input
                id="student-birth"
                type="date"
                value={values.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-level">Niveau en lecture arabe</Label>
              <select
                id="student-level"
                value={values.arabicReadingLevel}
                onChange={(e) =>
                  set("arabicReadingLevel", e.target.value as StudentValues["arabicReadingLevel"])
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="debutant">Débutante</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancée</option>
              </select>
            </div>
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="student-password">Mot de passe initial</Label>
              <Input
                id="student-password"
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="maraakiz"
              />
              <p className="text-xs text-muted-foreground">
                Laissé vide, il vaut « maraakiz ». L&apos;élève pourra le changer.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="student-whatsapp">WhatsApp</Label>
              <Input
                id="student-whatsapp"
                value={values.whatsappPhone}
                onChange={(e) => set("whatsappPhone", e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-phone">Téléphone local</Label>
              <Input
                id="student-phone"
                value={values.localPhone}
                onChange={(e) => set("localPhone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="student-paypal">Adresse PayPal</Label>
              <Input
                id="student-paypal"
                value={values.paypalAddress}
                onChange={(e) => set("paypalAddress", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border/70 bg-accent/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Adresse et fuseau horaire
            </p>
            <CountryTimezoneFields
              values={values.address}
              onChange={(address) => set("address", address)}
              instituteZoneLabel={instituteZoneLabel}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="student-experience">Expérience passée</Label>
            <textarea
              id="student-experience"
              value={values.previousExperience}
              onChange={(e) => set("previousExperience", e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="student-notes">Remarque permanente</Label>
            <textarea
              id="student-notes"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Ne peut pas le samedi, fuseau décalé…"
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Pour le suivi daté, utilisez les notes privées de la fiche.
            </p>
          </div>

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
export function EditStudentButton(props: {
  instituteZoneLabel: string;
  initial: StudentValues;
}) {
  return (
    <StudentDialog
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
