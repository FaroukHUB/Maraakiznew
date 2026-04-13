"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStudentProfile } from "@/actions/students";
import { Pencil } from "lucide-react";

type ProfileData = {
  profileId: string;
  name: string;
  email: string;
  whatsappPhone: string | null;
  localPhone: string | null;
  paypalAddress: string | null;
  arabicReadingLevel: string;
  previousExperience: string | null;
  notes: string | null;
};

export function EditProfileForm({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(data.name);
  const [email, setEmail] = useState(data.email);
  const [whatsappPhone, setWhatsappPhone] = useState(data.whatsappPhone ?? "");
  const [localPhone, setLocalPhone] = useState(data.localPhone ?? "");
  const [paypalAddress, setPaypalAddress] = useState(data.paypalAddress ?? "");
  const [level, setLevel] = useState(data.arabicReadingLevel);
  const [experience, setExperience] = useState(data.previousExperience ?? "");
  const [notes, setNotes] = useState(data.notes ?? "");

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-3 w-3 mr-2" />
        Modifier
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateStudentProfile(data.profileId, {
      name,
      email,
      whatsappPhone,
      localPhone,
      paypalAddress,
      arabicReadingLevel: level as "debutant" | "intermediaire" | "avance",
      previousExperience: experience,
      notes,
    });

    if (result.success) {
      setSaved(true);
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 rounded-lg border border-border">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Nom</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">WhatsApp</Label>
          <Input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Téléphone local</Label>
          <Input value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">PayPal</Label>
          <Input value={paypalAddress} onChange={(e) => setPaypalAddress(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Niveau</Label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
          >
            <option value="debutant">Débutante</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancée</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Expérience</Label>
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notes admin</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
