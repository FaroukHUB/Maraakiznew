"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Search, UserRound, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type GroupRow = {
  id: string;
  name: string;
  programName: string | null;
  levelLabel: string | null;
  teacher: { id: string; name: string } | null;
  schedule: string | null;
  status: "active" | "archived";
  memberCount: number;
  capacity: number | null;
  sessionCount: number;
  nextSession: string | null;
  attendanceRate: number;
  attendanceRated: number;
};

/**
 * La liste des groupes.
 *
 * ── Les archivés ne disparaissent pas, ils s'effacent ──
 *
 * Un groupe archivé reste consultable : son assiduité et ses séances
 * font partie de l'histoire de l'institut. Il sort simplement de la vue
 * par défaut, et le filtre le ramène. Ce commentaire fait foi.
 */
export function GroupsList({ rows }: { rows: GroupRow[] }) {
  const [query, setQuery] = useState("");
  const [teacher, setTeacher] = useState("");
  const [status, setStatus] = useState("active");

  const teachers = useMemo(() => {
    const known = new Map<string, string>();
    for (const row of rows) {
      if (row.teacher) known.set(row.teacher.id, row.teacher.name);
    }
    return [...known].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const needle = query.trim().toLowerCase();
  const shown = rows.filter((row) => {
    if (status === "active" && row.status !== "active") return false;
    if (status === "archived" && row.status !== "archived") return false;
    if (teacher === "none" && row.teacher) return false;
    if (teacher && teacher !== "none" && row.teacher?.id !== teacher) return false;
    if (!needle) return true;
    return [row.name, row.programName ?? "", row.teacher?.name ?? "", row.schedule ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, programme, créneau…"
            className="pl-9"
            aria-label="Rechercher un groupe"
          />
        </div>

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
          <option value="none">Sans enseignante</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
          <option value="">Tous</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        {shown.length} groupe{shown.length > 1 ? "s" : ""} affiché
        {shown.length > 1 ? "s" : ""}
        {shown.length !== rows.length && <> sur {rows.length}</>}
      </p>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {rows.length === 0 ? "Aucun groupe" : "Aucun résultat"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {rows.length === 0
              ? "Un groupe réunit les élèves qui apprennent ensemble : il permet de planifier une séance sans re-cocher chaque élève, et de suivre l'assiduité d'une classe entière."
              : "Aucun groupe ne correspond à ces critères."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/groups/${row.id}`}
                className="glass tile flex h-full flex-col gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:border-primary/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{row.name}</h3>
                    {row.status === "archived" && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Archivé
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.programName && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {row.programName}
                      </span>
                    )}
                    {row.levelLabel && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {row.levelLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p
                    className={cn(
                      "flex items-center gap-1.5",
                      row.teacher ? "" : "text-muted-foreground"
                    )}
                  >
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {row.teacher?.name ?? "Pas encore attribué"}
                  </p>
                  {row.schedule && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {row.schedule}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    {row.nextSession ? (
                      <>Prochaine séance : {row.nextSession}</>
                    ) : (
                      <>Aucune séance à venir</>
                    )}
                  </p>
                </div>

                <Fill count={row.memberCount} capacity={row.capacity} />

                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <Stat
                    value={
                      row.capacity != null
                        ? `${row.memberCount}/${row.capacity}`
                        : String(row.memberCount)
                    }
                    label="élèves"
                  />
                  <Stat value={String(row.sessionCount)} label="séances" />
                  <Stat
                    value={row.attendanceRated > 0 ? `${row.attendanceRate}%` : "—"}
                    label="assiduité"
                    className={rateColor(row.attendanceRate, row.attendanceRated)}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Le remplissage du groupe.
 *
 * Sans capacité déclarée, il n'y a rien à remplir : la barre disparaît
 * plutôt que d'inventer un maximum.
 */
function Fill({ count, capacity }: { count: number; capacity: number | null }) {
  if (capacity == null || capacity <= 0) return null;
  const ratio = Math.min(1, count / capacity);
  const full = count >= capacity;

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", full ? "bg-warning" : "bg-primary")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {full && (
        <p className="mt-1 text-xs text-warning-foreground">Complet</p>
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div>
      <p className={cn("text-lg font-bold leading-none tabular-nums", className)}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "text-muted-foreground";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}
