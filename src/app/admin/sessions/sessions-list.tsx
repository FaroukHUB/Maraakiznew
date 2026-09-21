"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SessionRow = {
  id: string;
  studentName: string;
  studentProfileId: string;
  programName: string;
  sessionNumber: number;
  totalSessions: number;
  when: string;
  /** Mois « 2026-09 », calculé dans le fuseau de l'institut. */
  monthKey: string;
  monthLabel: string;
  durationMinutes: number;
  status: string;
  statusLabel: string;
  teacher: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
  participantCount: number;
  hasNotes: boolean;
  past: boolean;
  /** Ce qui reste à faire sur cette séance, ou null. */
  pending: boolean;
  pendingLabel: string | null;
};

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};

/**
 * La liste des séances.
 *
 * ── « À traiter » n'est pas un statut de plus ──
 *
 * C'est une LECTURE de l'existant — issue non tranchée, appel non fait,
 * compte rendu manquant. Ajouter un statut « à traiter » obligerait
 * quelqu'un à le poser et à le retirer ; la déduire ne demande rien et
 * ne se trompe jamais. La règle est écrite une seule fois, dans
 * `pendingReason` (`data/attendance.ts`), et sert aussi à l'écran
 * d'assiduité : deux définitions voisines donnaient deux nombres sur
 * deux écrans qui se renvoient l'un à l'autre. Ce commentaire fait foi.
 */
export function SessionsList({
  rows,
  startPending = false,
}: {
  rows: SessionRow[];
  /**
   * Arriver avec le filtre « à traiter » déjà posé.
   *
   * L'assiduité renvoie ici pour faire le travail restant : elle doit
   * tomber sur la liste des séances concernées, pas sur les 48 autres.
   */
  startPending?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [teacher, setTeacher] = useState("");
  const [month, setMonth] = useState("");
  const [onlyPending, setOnlyPending] = useState(startPending);

  const teachers = useMemo(() => {
    const known = new Map<string, string>();
    for (const row of rows) if (row.teacher) known.set(row.teacher.id, row.teacher.name);
    return [...known].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const months = useMemo(() => {
    const known = new Map<string, string>();
    for (const row of rows) known.set(row.monthKey, row.monthLabel);
    return [...known]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }));
  }, [rows]);

  const pendingCount = rows.filter((row) => row.pending).length;

  const needle = query.trim().toLowerCase();
  const shown = rows.filter((row) => {
    if (onlyPending && !row.pending) return false;
    if (status && row.status !== status) return false;
    if (teacher === "none" && row.teacher) return false;
    if (teacher && teacher !== "none" && row.teacher?.id !== teacher) return false;
    if (month && row.monthKey !== month) return false;
    if (!needle) return true;
    return [row.studentName, row.programName, row.teacher?.name ?? "", row.group?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const upcoming = shown.filter((row) => !row.past);
  const past = shown.filter((row) => row.past);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par élève, programme, groupe…"
            className="pl-9"
            aria-label="Rechercher une séance"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="planned">Planifiée</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
          <option value="student_absent">Élève absente</option>
          <option value="teacher_absent">Prof absente</option>
        </select>

        <select
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          aria-label="Filtrer par enseignante"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Toutes les enseignantes</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <option value="none">Non assignée</option>
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Filtrer par mois"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Tous les mois</option>
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOnlyPending((value) => !value)}
          aria-pressed={onlyPending}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
            onlyPending
              ? "border-warning/40 bg-warning/15 text-warning-foreground"
              : "border-input text-muted-foreground hover:bg-accent/40"
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          À traiter
          {pendingCount > 0 && (
            <span className="rounded-full bg-warning/25 px-1.5 text-xs tabular-nums">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {shown.length} séance{shown.length > 1 ? "s" : ""} affichée
        {shown.length > 1 ? "s" : ""}
        {shown.length !== rows.length && <> sur {rows.length}</>}
      </p>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {rows.length === 0 ? "Aucune séance" : "Aucun résultat"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {rows.length === 0
              ? "Une séance s'impute toujours sur le forfait d'une élève : c'est lui qui ouvre le droit aux séances."
              : "Aucune séance ne correspond à ces critères."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Section title="À venir" count={upcoming.length} rows={upcoming} />
          )}
          {past.length > 0 && (
            <Section title="Passées" count={past.length} rows={past} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  rows,
}: {
  title: string;
  count: number;
  rows: SessionRow[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
        {title} ({count})
      </h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/admin/sessions/${row.id}`}
              className="glass tile flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border/70 p-3 transition-colors hover:border-primary/30"
            >
              <div className="w-44 shrink-0">
                <p className="text-sm font-medium capitalize">{row.when}</p>
                <p className="text-xs text-muted-foreground">
                  {row.durationMinutes} min
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.studentName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.programName} · séance {row.sessionNumber}/{row.totalSessions}
                  {row.group && (
                    <>
                      {" · "}
                      <span className="text-success">{row.group.name}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="w-36 shrink-0 text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Enseignante
                </p>
                <p className={cn("truncate text-sm", row.teacher ? "" : "text-muted-foreground")}>
                  {row.teacher?.name ?? "—"}
                </p>
              </div>

              {row.participantCount > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {row.participantCount}
                </span>
              )}

              <div className="flex shrink-0 items-center gap-2">
                {row.pendingLabel && (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning-foreground">
                    {row.pendingLabel}
                  </span>
                )}
                {row.hasNotes && !row.pending && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                    noté
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[row.status] ?? ""}`}
                >
                  {row.statusLabel}
                </Badge>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
