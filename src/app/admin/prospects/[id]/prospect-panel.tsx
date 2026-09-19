"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, UserCheck, Trash2 } from "lucide-react";
import {
  updateProspect,
  convertProspect,
  deleteProspect,
  createAppointment,
} from "@/actions/prospects";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants";

export function ProspectPanel({
  id,
  name,
  email,
  status,
  notes,
  lostReason,
}: {
  id: string;
  name: string;
  email: string | null;
  status: string;
  notes: string | null;
  lostReason: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [noteText, setNoteText] = useState(notes ?? "");
  const [reason, setReason] = useState(lostReason ?? "");

  const [converting, setConverting] = useState(false);
  const [convEmail, setConvEmail] = useState(email ?? "");
  const [convPassword, setConvPassword] = useState("");

  const [scheduling, setScheduling] = useState(false);
  const [apptTitle, setApptTitle] = useState("Entretien de découverte");
  const [apptDate, setApptDate] = useState("");
  const [apptDuration, setApptDuration] = useState("30");

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await fn();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur inattendue.");
    }
    setPending(false);
    return result;
  }

  const converted = status === "converted";

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {!converted && (
          <div className="space-y-2">
            <Label>Étape</Label>
            <div className="flex flex-wrap gap-2">
              {(["new", "contacted", "trial_scheduled", "lost"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? "default" : "outline"}
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      updateProspect(id, {
                        status: s,
                        ...(s === "lost" && { lostReason: reason }),
                      })
                    )
                  }
                >
                  {PROSPECT_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            {status === "lost" && (
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => run(() => updateProspect(id, { lostReason: reason }))}
                placeholder="Pourquoi n'a-t-elle pas donné suite ?"
                className="mt-2"
              />
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={pending}
              onClick={async () => {
                const r = await run(() => updateProspect(id, { notes: noteText }));
                if (r.success) setSaved(true);
              }}
            >
              Enregistrer
            </Button>
            {saved && <span className="text-sm text-success">Enregistré</span>}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!converted && (
          <div className="space-y-3 pt-3 border-t border-border">
            {scheduling ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    value={apptTitle}
                    onChange={(e) => setApptTitle(e.target.value)}
                    placeholder="Objet"
                  />
                  <Input
                    type="datetime-local"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="5"
                    value={apptDuration}
                    onChange={(e) => setApptDuration(e.target.value)}
                    placeholder="Durée (min)"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending || !apptDate}
                    onClick={async () => {
                      const r = await run(() =>
                        createAppointment({
                          title: apptTitle,
                          scheduledAt: apptDate,
                          durationMinutes: parseInt(apptDuration, 10),
                          prospectId: id,
                        })
                      );
                      if (r.success) setScheduling(false);
                    }}
                  >
                    Poser le rendez-vous
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setScheduling(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setScheduling(true)}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Poser un rendez-vous
              </Button>
            )}

            {converting ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Inscrire {name}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="email"
                    value={convEmail}
                    onChange={(e) => setConvEmail(e.target.value)}
                    placeholder="Email de connexion"
                  />
                  <Input
                    value={convPassword}
                    onChange={(e) => setConvPassword(e.target.value)}
                    placeholder="Mot de passe provisoire"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  La conversion crée son compte et garde la trace de son origine.
                  Elle est définitive.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending || !convEmail || convPassword.length < 8}
                    onClick={async () => {
                      const r = await run(() =>
                        convertProspect(id, { email: convEmail, password: convPassword })
                      );
                      if (r.success && "id" in r && r.id) router.push(`/admin/students/${r.id}`);
                    }}
                  >
                    Confirmer l&apos;inscription
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConverting(false)}>
                    Retour
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setConverting(true)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Inscrire comme élève
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={pending}
                  onClick={async () => {
                    const r = await run(() => deleteProspect(id));
                    if (r.success) router.push("/admin/prospects");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
