"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateSettings } from "@/actions/settings";
import { TimezoneSelect } from "@/components/ui/timezone-select";

type Settings = {
  instituteName: string;
  instituteTagline: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  invoiceFooter: string;
  timezone: string;
};

export function SettingsForm({ current }: { current: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState(current);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof Settings, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await updateSettings(values);
    if (result.success) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;institut</Label>
              <Input
                id="name"
                value={values.instituteName}
                onChange={(e) => set("instituteName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Signature</Label>
              <Input
                id="tagline"
                value={values.instituteTagline}
                onChange={(e) => set("instituteTagline", e.target.value)}
                placeholder="L'excellence au service de la transmission"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire de l&apos;institut</Label>
            <TimezoneSelect
              id="timezone"
              value={values.timezone}
              onChange={(value) => set("timezone", value)}
            />
            <p className="text-xs text-muted-foreground">
              Toutes les heures du planning sont exprimées dans ce fuseau.
              Une élève qui vit ailleurs voit les siennes, converties.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                type="email"
                value={values.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
              <Input
                id="whatsapp"
                value={values.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
              <p className="text-xs text-muted-foreground">
                Renseigné, il fait apparaître le bouton de contact sur toutes
                les pages.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <textarea
              id="address"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer">Mentions au bas des factures</Label>
            <textarea
              id="footer"
              value={values.invoiceFooter}
              onChange={(e) => set("invoiceFooter", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="SIRET, TVA non applicable, conditions de règlement..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            {saved && <span className="text-sm text-success">Enregistré</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
