"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import { addGroupMembers, removeGroupMember } from "@/actions/groups";

type Member = { studentProfileId: string; name: string };
type Student = { profileId: string; name: string };

export function MembersForm({
  groupId,
  capacity,
  members,
}: {
  groupId: string;
  capacity: number | null;
  members: Member[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adding || students.length > 0) return;
    fetch("/api/admin/students-and-programs")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => setError("Impossible de charger la liste des élèves."));
  }, [adding, students.length]);

  const memberIds = members.map((m) => m.studentProfileId);
  const available = students.filter((s) => !memberIds.includes(s.profileId));
  const remaining = capacity != null ? capacity - members.length : null;

  async function handleAdd() {
    if (selected.length === 0) return;
    setPending(true);
    setError(null);

    const result = await addGroupMembers(groupId, selected);
    if (result.success) {
      setSelected([]);
      setAdding(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  async function handleRemove(studentProfileId: string) {
    setPending(true);
    setError(null);

    const result = await removeGroupMember(groupId, studentProfileId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune élève dans ce groupe. Ajoutez-en pour pouvoir rattacher des
          séances.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div
              key={member.studentProfileId}
              className="flex items-center justify-between py-2.5"
            >
              <Link
                href={`/admin/students/${member.studentProfileId}`}
                className="text-sm font-medium hover:text-primary"
              >
                {member.name}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => handleRemove(member.studentProfileId)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Retirer ${member.name} du groupe`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!adding ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          disabled={remaining === 0}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {remaining === 0 ? "Groupe complet" : "Ajouter des élèves"}
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-border p-3">
          {remaining != null && (
            <p className="text-xs text-muted-foreground">
              {remaining} place{remaining > 1 ? "s" : ""} restante
              {remaining > 1 ? "s" : ""} sur {capacity}
            </p>
          )}

          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Toutes les élèves sont déjà dans ce groupe.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-border">
              {available.map((student) => (
                <label
                  key={student.profileId}
                  className="flex items-center gap-3 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(student.profileId)}
                    onChange={() =>
                      setSelected((prev) =>
                        prev.includes(student.profileId)
                          ? prev.filter((id) => id !== student.profileId)
                          : [...prev, student.profileId]
                      )
                    }
                    className="rounded"
                  />
                  <span className="text-sm">{student.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={pending || selected.length === 0}>
              {pending ? "Ajout..." : `Ajouter (${selected.length})`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                setSelected([]);
                setError(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
