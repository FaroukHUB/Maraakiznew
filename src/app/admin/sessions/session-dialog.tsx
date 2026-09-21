"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, Pencil } from "lucide-react";
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
import { createSession, updateSession } from "@/actions/sessions";
import { assignSessionStaff } from "@/actions/staff";
import { attachSessionToGroup } from "@/actions/groups";
import { instantFromLocalInput, formatLongDateTime } from "@/lib/datetime";
import { dayShift, isQuietHour, zoneLabel } from "@/lib/timezones";

export type Subscription = {
  id: string;
  studentName: string;
  programName: string;
  totalSessions: number;
  nextSessionNumber: number;
  /** Forfait dont toutes les séances sont déjà planifiées. */
  full: boolean;
  studentTimezone: string | null;
};

export type SessionValues = {
  id?: string;
  subscriptionId: string;
  scheduledAt: string;
  durationMinutes: string;
  zoomLink: string;
  staffMemberId: string;
  groupId: string;
  /** Fuseau de l'élève concernée, pour l'avertissement d'heure locale. */
  studentTimezone: string | null;
};

const EMPTY: SessionValues = {
  subscriptionId: "",
  scheduledAt: "",
  durationMinutes: "60",
  zoomLink: "",
  staffMemberId: "",
  groupId: "",
  studentTimezone: null,
};

/**
 * Planifier ou modifier une séance, en modale.
 *
 * ── L'heure saisie est celle de l'INSTITUT ──
 *
 * Un champ `datetime-local` rend une heure sans fuseau, que le navigateur
 * interpréterait dans le sien. On la lit donc explicitement dans le fuseau
 * de l'institut : c'est son planning qu'on remplit, pas celui de la
 * personne qui tient le clavier — laquelle peut être en voyage.
 *
 * L'écran dit ensuite ce que cette heure donne CHEZ L'ÉLÈVE, et
 * avertit quand elle tombe la nuit ou un autre jour. C'est le seul
 * moment où l'on peut encore corriger sans déranger personne.
 * Ce commentaire fait foi.
 */
export function SessionDialog({
  timeZone,
  subscriptions,
  teachers,
  groups,
  initial,
  trigger,
  openOnParam,
}: {
  timeZone: string;
  subscriptions: Subscription[];
  teachers: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  initial?: SessionValues;
  /** Élément à FUSIONNER avec le déclencheur. Jamais un enfant. */
  trigger?: React.ReactElement;
  /**
   * Paramètre d'adresse qui ouvre la modale tout seul, par exemple
   * `?planifier=1` : les boutons « Planifier » des autres écrans mènent
   * ici et tombent directement sur le formulaire, au lieu de déposer
   * l'utilisatrice devant une liste. Le paramètre est retiré à la
   * fermeture, pour qu'un rechargement ne rouvre pas la modale.
   */
  openOnParam?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const asked = Boolean(openOnParam && params.get(openOnParam));
  /**
   * `null` veut dire « personne n'a encore décidé » : c'est l'adresse qui
   * tranche. Dériver l'ouverture plutôt que la recopier dans un effet
   * évite un rendu de plus, et surtout évite qu'une arrivée par lien
   * trouve la modale fermée parce qu'elle l'était la fois d'avant.
   */
  const [decided, setDecided] = useState<boolean | null>(null);
  const open = decided ?? asked;
  const [values, setValues] = useState<SessionValues>(initial ?? EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = Boolean(initial?.id);

  function set<K extends keyof SessionValues>(key: K, value: SessionValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onOpenChange(next: boolean) {
    if (next) {
      setDecided(true);
      setValues(initial ?? EMPTY);
      setError(null);
      return;
    }
    if (asked) {
      // On retire le paramètre ET on rend la main à l'adresse : un
      // rechargement ne rouvrira pas la modale, une nouvelle arrivée par
      // lien la rouvrira.
      router.replace(pathname);
      setDecided(null);
    } else {
      setDecided(false);
    }
  }

  const chosen = subscriptions.find((sub) => sub.id === values.subscriptionId);
  const instant = values.scheduledAt
    ? instantFromLocalInput(values.scheduledAt, timeZone)
    : null;
  const studentZone =
    (editing ? values.studentTimezone : chosen?.studentTimezone) ?? timeZone;
  const elsewhere = studentZone !== timeZone;
  const quiet = instant ? isQuietHour(instant, studentZone) : false;
  const shift = instant ? dayShift(instant, studentZone, timeZone) : 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const duration = Number.parseInt(values.durationMinutes, 10);
    if (Number.isNaN(duration) || duration < 5) {
      setError("La durée doit être un nombre de minutes.");
      setPending(false);
      return;
    }
    if (!instant) {
      setError("Indiquez la date et l'heure de la séance.");
      setPending(false);
      return;
    }

    if (initial?.id) {
      const result = await updateSession(initial.id, {
        scheduledAt: instant,
        durationMinutes: duration,
        zoomLink: values.zoomLink,
      });
      if (!result.success) {
        setError(result.error);
        setPending(false);
        return;
      }

      // L'enseignante et le groupe ont leurs propres actions : elles
      // font plus que poser une colonne (le groupe inscrit ses membres).
      if (values.staffMemberId !== (initial.staffMemberId ?? "")) {
        await assignSessionStaff(initial.id, values.staffMemberId || null);
      }
      if (values.groupId && values.groupId !== initial.groupId) {
        const attached = await attachSessionToGroup(initial.id, values.groupId);
        if (!attached.success) {
          setError(attached.error);
          setPending(false);
          return;
        }
      }
    } else {
      if (!chosen) {
        setError("Choisissez le forfait sur lequel imputer la séance.");
        setPending(false);
        return;
      }
      const result = await createSession({
        subscriptionId: chosen.id,
        sessionNumber: chosen.nextSessionNumber,
        scheduledAt: instant,
        durationMinutes: duration,
        zoomLink: values.zoomLink || undefined,
      });
      if (!result.success) {
        setError(result.error);
        setPending(false);
        return;
      }
    }

    onOpenChange(false);
    router.refresh();
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
              <CalendarPlus className="mr-2 h-4 w-4" />
              Planifier une séance
            </Button>
          )
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Modifier la séance" : "Planifier une séance"}
          </DialogTitle>
          <DialogDescription>
            Les heures sont celles de l&apos;institut ({zoneLabel(timeZone)}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="seance-forfait">Forfait</Label>
              {subscriptions.length === 0 ? (
                <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning-foreground">
                  Aucun forfait actif. Une séance s&apos;impute toujours sur un
                  forfait : créez-en un depuis la fiche d&apos;une élève.
                </p>
              ) : (
                <>
                  <select
                    id="seance-forfait"
                    value={values.subscriptionId}
                    onChange={(e) => set("subscriptionId", e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Choisir une élève…</option>
                    {subscriptions.map((sub) => (
                      <option key={sub.id} value={sub.id} disabled={sub.full}>
                        {sub.studentName} — {sub.programName}{" "}
                        {sub.full
                          ? `(forfait complet : ${sub.totalSessions} séances)`
                          : `(séance ${sub.nextSessionNumber}/${sub.totalSessions})`}
                      </option>
                    ))}
                  </select>
                  {chosen && !chosen.full && (
                    <p className="text-xs text-muted-foreground">
                      Ce sera la séance {chosen.nextSessionNumber} sur{" "}
                      {chosen.totalSessions}.
                    </p>
                  )}
                  {subscriptions.some((sub) => sub.full) && (
                    <p className="text-xs text-muted-foreground">
                      Les forfaits dont toutes les séances sont planifiées ne
                      sont pas proposés : créez un nouveau forfait pour
                      continuer avec ces élèves.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="seance-date">Date et heure</Label>
              <Input
                id="seance-date"
                type="datetime-local"
                value={values.scheduledAt}
                onChange={(e) => set("scheduledAt", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seance-duree">Durée (minutes)</Label>
              <Input
                id="seance-duree"
                inputMode="numeric"
                value={values.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                required
              />
            </div>
          </div>

          {instant && (
            <div className="space-y-1 rounded-lg border border-border/70 bg-accent/20 px-3 py-2 text-xs">
              <p className="capitalize text-muted-foreground">
                Institut : {formatLongDateTime(instant, timeZone)}
              </p>
              {elsewhere && (
                <p className="capitalize text-muted-foreground">
                  Chez l&apos;élève ({zoneLabel(studentZone)}) :{" "}
                  {formatLongDateTime(instant, studentZone)}
                </p>
              )}
              {shift !== 0 && (
                <p className="text-warning-foreground">
                  Attention : ce sera {shift > 0 ? "le lendemain" : "la veille"} pour
                  l&apos;élève.
                </p>
              )}
              {quiet && (
                <p className="text-warning-foreground">
                  Attention : il sera entre 22 h et 7 h chez l&apos;élève.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="seance-enseignante">Enseignante</Label>
                <select
                  id="seance-enseignante"
                  value={values.staffMemberId}
                  onChange={(e) => set("staffMemberId", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Non assignée</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seance-groupe">Groupe</Label>
                <select
                  id="seance-groupe"
                  value={values.groupId}
                  onChange={(e) => set("groupId", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Aucun</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Rattacher à un groupe y inscrit d&apos;office ses membres.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="seance-zoom">Lien de visioconférence</Label>
            <Input
              id="seance-zoom"
              value={values.zoomLink}
              onChange={(e) => set("zoomLink", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={pending || (!editing && subscriptions.length === 0)}
            >
              {pending ? "Enregistrement..." : editing ? "Enregistrer" : "Planifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Le déclencheur de la modale de modification, sur la fiche. */
export function EditSessionButton(props: {
  timeZone: string;
  subscriptions: Subscription[];
  teachers: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  initial: SessionValues;
}) {
  return (
    <SessionDialog
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
