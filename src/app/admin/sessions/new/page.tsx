"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSession } from "@/actions/sessions";

type Subscription = {
  id: string;
  studentName: string;
  programName: string;
  totalSessions: number;
  nextSessionNumber: number;
};

export default function NewSessionPage() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSub || !scheduledAt) return;
    setSubmitting(true);
    setError(null);

    const result = await createSession({
      subscriptionId: selectedSub,
      sessionNumber: selected?.nextSessionNumber ?? 1,
      scheduledAt: new Date(scheduledAt),
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
              <Label htmlFor="scheduledAt">Date et heure</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

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
