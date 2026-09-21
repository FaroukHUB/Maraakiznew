"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { addGroupMembers, removeGroupMember } from "@/actions/groups";
import { cn } from "@/lib/utils";

export type Member = {
  studentProfileId: string;
  name: string;
  levelLabel: string;
  /** Taux d'assiduité DANS ce groupe, ou null si rien n'est encore noté. */
  rate: number | null;
  missed: number;
};

/**
 * Les élèves d'un groupe.
 *
 * ── L'assiduité est celle DU GROUPE ──
 *
 * Le taux affiché ne porte que sur les séances de ce groupe, pas sur
 * toute la scolarité de l'élève : c'est ce qui permet de voir qu'une
 * élève assidue ailleurs manque celui-ci. Il vient de
 * `getAttendanceByStudent({ groupId })`, seul point d'entrée du taux.
 * Ce commentaire fait foi.
 */
export function MembersPanel({
  groupId,
  capacity,
  members,
  available,
}: {
  groupId: string;
  capacity: number | null;
  members: Member[];
  available: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const remaining = capacity != null ? capacity - members.length : null;
  const needle = query.trim().toLowerCase();
  const candidates = available.filter((student) =>
    needle ? student.name.toLowerCase().includes(needle) : true
  );

  function add() {
    if (picked.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await addGroupMembers(groupId, picked);
      if (result.success) setPicked([]);
      else setError(result.error);
      router.refresh();
    });
  }

  function remove(studentProfileId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeGroupMember(groupId, studentProfileId);
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">
          Élèves ({members.length}
          {capacity != null && <>/{capacity}</>})
        </h3>
        {remaining != null && (
          <p
            className={cn(
              "text-sm",
              remaining <= 0 ? "text-warning-foreground" : "text-muted-foreground"
            )}
          >
            {remaining > 0
              ? `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`
              : "Groupe complet"}
          </p>
        )}
      </div>

      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Ce groupe est vide. Ajoutez des élèves ci-dessous : elles seront
          inscrites d&apos;office aux séances rattachées au groupe.
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.studentProfileId}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/students/${member.studentProfileId}`}
                  className="font-medium hover:text-primary"
                >
                  {member.name}
                </Link>
                <p className="text-xs text-muted-foreground">{member.levelLabel}</p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    rateColor(member.rate)
                  )}
                >
                  {member.rate === null ? "—" : `${member.rate} %`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.rate === null
                    ? "pas encore noté"
                    : member.missed > 0
                      ? `${member.missed} absence${member.missed > 1 ? "s" : ""}`
                      : "assiduité"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(member.studentProfileId)}
                disabled={pending}
                aria-label={`Retirer ${member.name} du groupe`}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-border/70 p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          Ajouter des élèves
        </p>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Toutes les élèves de l&apos;institut sont déjà dans ce groupe.
          </p>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une élève…"
                className="pl-9"
                aria-label="Rechercher une élève à ajouter"
              />
            </div>

            <div className="max-h-56 space-y-1 overflow-y-auto">
              {candidates.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  Aucune élève ne correspond.
                </p>
              ) : (
                candidates.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={picked.includes(student.id)}
                      onChange={() =>
                        setPicked((prev) =>
                          prev.includes(student.id)
                            ? prev.filter((id) => id !== student.id)
                            : [...prev, student.id]
                        )
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    {student.name}
                  </label>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={add}
              disabled={pending || picked.length === 0}
              className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
            >
              {pending
                ? "Ajout..."
                : picked.length === 0
                  ? "Sélectionnez au moins une élève"
                  : `Ajouter ${picked.length} élève${picked.length > 1 ? "s" : ""}`}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function rateColor(rate: number | null): string {
  if (rate === null) return "text-muted-foreground";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
