"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createStudent } from "@/actions/students";

export default function NewStudentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("student123");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [paypalAddress, setPaypalAddress] = useState("");
  const [arabicReadingLevel, setArabicReadingLevel] = useState("debutant");
  const [previousExperience, setPreviousExperience] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createStudent({
      name,
      email,
      password,
      whatsappPhone: whatsappPhone || undefined,
      localPhone: localPhone || undefined,
      paypalAddress: paypalAddress || undefined,
      arabicReadingLevel: arabicReadingLevel as "debutant" | "intermediaire" | "avance",
      previousExperience: previousExperience || undefined,
      notes: notes || undefined,
    });

    if (result.success) {
      router.push(result.id ? `/admin/students/${result.id}` : "/admin/students");
      router.refresh();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inscrire une élève</h2>
        <p className="text-muted-foreground mt-1">
          Créer un compte et un profil pédagogique
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Prénom Nom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mot de passe initial</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
              />
              <p className="text-xs text-muted-foreground">
                L&apos;élève pourra le changer plus tard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone local</Label>
                <Input
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  placeholder="+213 ..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse PayPal</Label>
              <Input
                value={paypalAddress}
                onChange={(e) => setPaypalAddress(e.target.value)}
                placeholder="email@paypal.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pedagogy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil pédagogique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Niveau en lecture arabe</Label>
              <select
                value={arabicReadingLevel}
                onChange={(e) => setArabicReadingLevel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="debutant">Débutante</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancée</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Expérience passée</Label>
              <textarea
                value={previousExperience}
                onChange={(e) => setPreviousExperience(e.target.value)}
                placeholder="Parcours précédent, formations suivies, niveau actuel..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes admin (privées)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations, remarques..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Inscription..." : "Inscrire l'élève"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
