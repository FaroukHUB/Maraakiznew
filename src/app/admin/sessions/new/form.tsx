"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSession } from "@/actions/sessions";
import { instantFromLocalInput, formatLongDateTime } from "@/lib/datetime";
import { isQuietHour, zoneLabel, dayShift } from "@/lib/timezones";

type Subscription = {
  id: string;
  studentName: string;
  programName: string;
  totalSessions: number;
  nextSessionNumber: number;
  studentTimezone: string | null;
};

export function NewSessionForm({ timeZone }: { timeZone: string }) {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSub, setSelectedSub] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [zoomLink, setZoomLink] = useState("");

  useEffect(() => {
    fetch("/api/admin/active-subscriptions")
      .then((r) => r.json())
      .then((data) => {
        setSubs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selected = subs.find((s) => s.id === selectedSub);

  // La saisie est lue dans le fuseau de l'INSTITUT, pas celui du
  // navigateur : c'est le planning de l'institut qu'on remplit.
  const instant = scheduledAt ? instantFromLocalInput(scheduledAt, timeZone) : null;
  const studentZone = selected?.studentTimezone ?? timeZone;
  const elsewhere = studentZone !== timeZone;
  const quiet = instant ? isQuietHour(instant, studentZone) : false;
  const shift = instant ? dayShift(instant, studentZone, timeZone) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSub || !scheduledAt) return;
    setSubmitting(true);
    setError(null);

    const result = await createSession({
      subscriptionId: selectedSub,
      sessionNumber: selected?.nextSessionNumber ?? 1,
      scheduledAt: instant ?? new Date(scheduledAt),
      durationMinutes: parseInt(duration),
      zoomLink: zoomLink || undefined,
    });

    if (result.success) {
      router.push("/admin/sessions");
      router.refresh();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Planifier une séance</h2>
        <p className="text-muted-foreground mt-1">
          Créer une nouvelle séance pour une élève
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subscription select */}
            <div className="space-y-2">
              <Label htmlFor="subscription">Élève / Forfait</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <select
                  id="subscription"
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">Sélectionner un forfait actif</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} — {s.programName} ({s.nextSessionNumber}/{s.totalSessions})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selected && (
              <div className="text-sm text-muted-foreground p-3 rounded-lg bg-accent/30">
                Séance n°{selected.nextSessionNumber} sur {selected.totalSessions}
              </div>
            )}

            {/* Date/time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">
                Date et heure{" "}
                <span className="font-normal text-muted-foreground">
                  — heure de {zoneLabel(timeZone)}
                </span>
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            {/* L'heure chez l'élève, quand elle diffère */}
            {instant && elsewhere && (
              <div
                className={
                  quiet
                    ? "rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
                    : "rounded-lg border border-border bg-accent/30 p-3 text-sm"
                }
              >
                <p className="font-medium">
                  Chez {selected?.studentName.split(" ")[0]} à{" "}
                  {zoneLabel(studentZone)} :{" "}
                  <span className="font-semibold">
                    {formatLongDateTime(instant, studentZone)}
                  </span>
                  {shift !== 0 && (
                    <span className="text-primary">
                      {" "}
                      ({shift > 0 ? "le lendemain" : "la veille"})
                    </span>
                  )}
                </p>
                {quiet && (
                  <p className="mt-1 text-warning-foreground">
                    C&apos;est la nuit chez elle. À confirmer avant
                    d&apos;enregistrer.
                  </p>
                )}
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Durée (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            {/* Zoom link */}
            <div className="space-y-2">
              <Label htmlFor="zoomLink">Lien Zoom (optionnel)</Label>
              <Input
                id="zoomLink"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Création..." : "Planifier la séance"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
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
