"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { createStaffMember } from "@/actions/staff";
import { STAFF_ROLE_LABELS } from "@/lib/constants";

export function StaffForm({
  supervisors,
}: {
  supervisors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("teacher");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"hourly" | "monthly" | "none">("hourly");
  const [rate, setRate] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const amount = rate ? parseFloat(rate) : undefined;
    const result = await createStaffMember({
      name,
      role: role as "teacher" | "secretary" | "supervisor" | "pedagogical_lead" | "manager",
      email: email || undefined,
      phone: phone || undefined,
      hourlyRate: mode === "hourly" ? amount : undefined,
      monthlyRate: mode === "monthly" ? amount : undefined,
      supervisorId: supervisorId || undefined,
    });

    if (result.success) {
      setName("");
      setEmail("");
      setPhone("");
      setRate("");
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
        Ajouter un membre
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
              >
                {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mode">Rémunération</Label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="hourly">À l&apos;heure</option>
                <option value="monthly">Forfait mensuel</option>
                <option value="none">Non rémunérée</option>
              </select>
            </div>
            {mode !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="rate">{mode === "hourly" ? "€ / heure" : "€ / mois"}</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="supervisor">Superviseure</Label>
              <select
                id="supervisor"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">—</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending || !name.trim()}>
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
