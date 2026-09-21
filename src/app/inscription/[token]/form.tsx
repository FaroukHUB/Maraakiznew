"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPublicRegistration } from "@/actions/registration";

/**
 * Le formulaire vu par la future élève.
 *
 * Il demande le strict nécessaire pour être rappelée : un nom, une
 * adresse, éventuellement un téléphone et un mot. Tout le reste — le
 * niveau réel, le forfait, l'adresse postale — se remplit à
 * l'inscription véritable, avec l'institut.
 */
export function RegistrationForm({
  token,
  instituteName,
}: {
  token: string;
  instituteName: string;
}) {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    level: "",
    message: "",
    website: "",
  });

  function set(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await submitPublicRegistration(token, values);
    if (result.success) setDone(true);
    else setError(result.error);
    setPending(false);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
        <p className="font-medium">Votre demande est bien arrivée.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {instituteName} vous recontacte à l&apos;adresse que vous avez indiquée.
          Vous n&apos;avez rien d&apos;autre à faire.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <p className="text-sm text-muted-foreground">
        Laissez vos coordonnées : l&apos;institut vous recontacte pour fixer
        un premier échange.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="inscription-nom">Nom et prénom</Label>
        <Input
          id="inscription-nom"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inscription-email">Email</Label>
        <Input
          id="inscription-email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inscription-tel">Téléphone (facultatif)</Label>
          <Input
            id="inscription-tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inscription-niveau">Votre niveau</Label>
          <select
            id="inscription-niveau"
            value={values.level}
            onChange={(e) => set("level", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Je ne sais pas</option>
            <option value="debutant">Débutante</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancée</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inscription-message">Votre message (facultatif)</Label>
        <textarea
          id="inscription-message"
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          rows={3}
          placeholder="Disponibilités, ce que vous souhaitez apprendre…"
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/*
        Le champ piège. Il est caché à l'œil ET aux lecteurs d'écran, et
        aucun navigateur ne le remplit automatiquement : seul un robot qui
        complète tous les champs d'un formulaire y écrira quelque chose.
      */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="inscription-site">Ne pas remplir</label>
        <input
          id="inscription-site"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Envoi..." : "Envoyer ma demande"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Vos coordonnées servent uniquement à vous recontacter au sujet de
        cette demande.
      </p>
    </form>
  );
}
