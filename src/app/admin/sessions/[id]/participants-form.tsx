"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSessionParticipants } from "@/actions/sessions";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type Participant = {
  studentProfileId: string;
  studentName: string;
  attendanceStatus: AttendanceStatus;
  hasReplayAccess: boolean;
};

const attendanceOptions: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Présente" },
  { value: "absent", label: "Absente" },
  { value: "late", label: "En retard" },
  { value: "excused", label: "Excusée" },
];

/**
 * Le pointage d'une séance de groupe.
 *
 * ── On peut AJOUTER quelqu'un ──
 *
 * Auparavant cet écran ne savait que modifier les présentes déjà
 * inscrites : une séance sans participante y était un cul-de-sac, et le
 * seul moyen d'en inscrire une était de rattacher la séance à un
 * groupe. Une élève qui rejoint une séance en cours de route n'entrait
 * nulle part.
 *
 * L'enregistrement REMPLACE la liste entière (`setSessionParticipants`),
 * et chaque participante est débitée sur SON propre forfait du même
 * programme — pas sur celui de la porteuse de la séance.
 * Ce commentaire fait foi.
 */
export function ParticipantsForm({
  sessionId,
  existingParticipants,
  candidates,
  groupName,
}: {
  sessionId: string;
  existingParticipants: {
    id: string;
    studentProfileId: string;
    attendanceStatus: string;
    hasReplayAccess: boolean;
    studentProfile: { id: string; user: { name: string } };
  }[];
  /** Élèves que l'on peut inscrire : membres du groupe, ou tout l'institut. */
  candidates: { id: string; name: string }[];
  groupName: string | null;
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>(
    existingParticipants.map((p) => ({
      studentProfileId: p.studentProfileId,
      studentName: p.studentProfile.user.name,
      attendanceStatus: p.attendanceStatus as AttendanceStatus,
      hasReplayAccess: p.hasReplayAccess,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const present = new Set(participants.map((p) => p.studentProfileId));
  const joinable = candidates.filter((student) => !present.has(student.id));

  function update(index: number, field: keyof Participant, value: unknown) {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
    setSaved(false);
  }

  function add(studentProfileId: string) {
    const student = candidates.find((c) => c.id === studentProfileId);
    if (!student) return;
    setParticipants((prev) => [
      ...prev,
      {
        studentProfileId: student.id,
        studentName: student.name,
        attendanceStatus: "present",
        hasReplayAccess: false,
      },
    ]);
    setSaved(false);
  }

  function remove(studentProfileId: string) {
    setParticipants((prev) =>
      prev.filter((p) => p.studentProfileId !== studentProfileId)
    );
    setSaved(false);
  }

  async function save() {
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await setSessionParticipants(
      sessionId,
      participants.map((p) => ({
        studentProfileId: p.studentProfileId,
        attendanceStatus: p.attendanceStatus,
        hasReplayAccess: p.hasReplayAccess,
      }))
    );

    if (result.success) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {groupName && (
        <p className="text-sm text-muted-foreground">
          Séance du groupe <strong>{groupName}</strong> : ses membres ont été
          inscrits au rattachement. Vous pouvez en ajouter ou en retirer ici.
        </p>
      )}

      {participants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune participante pour le moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {participants.map((participant, index) => (
            <li
              key={participant.studentProfileId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <span className="text-sm font-medium">{participant.studentName}</span>
              <div className="flex items-center gap-2">
                <select
                  value={participant.attendanceStatus}
                  aria-label={`Présence de ${participant.studentName}`}
                  onChange={(e) =>
                    update(index, "attendanceStatus", e.target.value as AttendanceStatus)
                  }
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {attendanceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={participant.hasReplayAccess}
                    onChange={(e) => update(index, "hasReplayAccess", e.target.checked)}
                    className="rounded"
                  />
                  Replay
                </label>
                <button
                  type="button"
                  onClick={() => remove(participant.studentProfileId)}
                  aria-label={`Retirer ${participant.studentName}`}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {joinable.length > 0 && (
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            defaultValue=""
            aria-label="Ajouter une participante"
            onChange={(e) => {
              add(e.target.value);
              e.target.value = "";
            }}
            className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Ajouter une participante…</option>
            {joinable.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer les présences"}
        </Button>
        {saved && <span className="text-sm text-success">Enregistré</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}
