"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setSessionParticipants } from "@/actions/sessions";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type Participant = {
  studentProfileId: string;
  studentName: string;
  attendanceStatus: AttendanceStatus;
  hasReplayAccess: boolean;
};

const attendanceOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Présente", color: "bg-success/15 text-success-foreground" },
  { value: "absent", label: "Absente", color: "bg-destructive/15 text-destructive" },
  { value: "late", label: "En retard", color: "bg-warning/15 text-warning-foreground" },
  { value: "excused", label: "Excusée", color: "bg-muted text-muted-foreground" },
];

export function ParticipantsForm({
  sessionId,
  subscriptionId,
  existingParticipants,
}: {
  sessionId: string;
  subscriptionId: string;
  existingParticipants: {
    id: string;
    studentProfileId: string;
    attendanceStatus: string;
    hasReplayAccess: boolean;
    studentProfile: { id: string; user: { name: string } };
  }[];
}) {
  const router = useRouter();
  const [participants, setParticipantsState] = useState<Participant[]>(
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

  function updateParticipant(idx: number, field: string, value: unknown) {
    setParticipantsState((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  }

  async function handleSave() {
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
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune participante enregistrée pour cette séance.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {participants.map((p, idx) => (
          <div
            key={p.studentProfileId}
            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
          >
            <span className="text-sm font-medium">{p.studentName}</span>
            <div className="flex items-center gap-2">
              <select
                value={p.attendanceStatus}
                onChange={(e) =>
                  updateParticipant(idx, "attendanceStatus", e.target.value)
                }
                className="h-8 px-2 rounded-md border border-input bg-background text-xs"
              >
                {attendanceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={p.hasReplayAccess}
                  onChange={(e) =>
                    updateParticipant(idx, "hasReplayAccess", e.target.checked)
                  }
                  className="rounded"
                />
                Replay
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer la présence"}
        </Button>
        {saved && <span className="text-sm text-success">Enregistré</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}
