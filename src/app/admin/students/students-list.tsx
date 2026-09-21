"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, LayoutGrid, List, Search, Star, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
/**
 * Le mode d'affichage tient dans un COOKIE, pas dans le navigateur seul.
 *
 * Il est donc lu par le serveur au moment du rendu : la page arrive déjà
 * dans le bon mode, sans le clignotement qu'imposerait un `localStorage`
 * lu après coup. Ce commentaire fait foi.
 */
import {
  VIEW_COOKIE_STUDENTS,
  VIEW_COOKIE_MAX_AGE,
} from "@/lib/view-cookies";

export type StudentListRow = {
  id: string;
  name: string;
  email: string;
  levelLabel: string;
  status: "active" | "suspended";
  age: number | null;
  groups: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  stars: number;
  programLabel: string | null;
  sessionsDone: number;
  sessionsTotal: number | null;
  enrolledAt: string;
};



/**
 * La liste des élèves.
 *
 * ── Filtrer ici, pas au serveur ──
 *
 * Un institut compte des dizaines d'élèves, pas des dizaines de
 * milliers : tout tient déjà dans la page. Filtrer côté navigateur
 * répond à chaque frappe, sans aller-retour. Le jour où la liste
 * deviendra longue, ce sera le moment de paginer — pas avant.
 * Ce commentaire fait foi.
 */
export function StudentsList({
  rows,
  initialView = "list",
}: {
  rows: StudentListRow[];
  initialView?: "list" | "grid";
}) {
  const [query, setQuery] = useState("");
  const [teacher, setTeacher] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"list" | "grid">(initialView);

  function chooseView(next: "list" | "grid") {
    setView(next);
    document.cookie = `${VIEW_COOKIE_STUDENTS}=${next}; path=/; max-age=${VIEW_COOKIE_MAX_AGE}; samesite=lax`;
  }

  const teachers = useMemo(() => {
    const known = new Map<string, string>();
    for (const row of rows) {
      for (const t of row.teachers) known.set(t.id, t.name);
    }
    return [...known].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const needle = query.trim().toLowerCase();
  const shown = rows.filter((row) => {
    if (teacher && !row.teachers.some((t) => t.id === teacher)) return false;
    if (status && row.status !== status) return false;
    if (!needle) return true;
    return [row.name, row.email, row.levelLabel, ...row.groups.map((g) => g.name)]
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
            placeholder="Rechercher par nom, email, groupe…"
            className="pl-9"
            aria-label="Rechercher une élève"
          />
        </div>

        <select
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          aria-label="Filtrer par enseignante"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Tous les profs.</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="suspended">Suspendues</option>
        </select>

        <div className="flex items-center rounded-lg border border-input">
          <button
            type="button"
            onClick={() => chooseView("list")}
            aria-pressed={view === "list"}
            aria-label="Affichage en liste"
            className={cn(
              "rounded-l-lg px-2.5 py-2 transition-colors",
              view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => chooseView("grid")}
            aria-pressed={view === "grid"}
            aria-label="Affichage en cartes"
            className={cn(
              "rounded-r-lg px-2.5 py-2 transition-colors",
              view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={() => exportCsv(shown)}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Exporter
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {shown.length} élève{shown.length > 1 ? "s" : ""} affichée
        {shown.length > 1 ? "s" : ""}
        {shown.length !== rows.length && <> sur {rows.length}</>}
      </p>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Users2 className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {rows.length === 0 ? "Aucune élève" : "Aucun résultat"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {rows.length === 0
              ? "Ajoutez une première élève : le reste de la fiche se remplit au fil des séances."
              : "Aucune élève ne correspond à ces critères."}
          </p>
        </div>
      ) : view === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/students/${row.id}`}
                className="glass tile flex h-full flex-col gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {initials(row.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {row.teachers[0]?.name ?? "Sans enseignante"}
                    </p>
                  </div>
                </div>
                <Tags row={row} />
                <div className="mt-auto flex items-center justify-between pt-1">
                  <StatusBadge status={row.status} />
                  <Stars count={row.stars} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {shown.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/students/${row.id}`}
                className="glass tile flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 p-4 transition-colors hover:border-primary/30"
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {initials(row.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.name}</p>
                  <Tags row={row} />
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Enseignante{row.teachers.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm">
                    {row.teachers.map((t) => t.name).join(", ") || "—"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Stars count={row.stars} />
                  <StatusBadge status={row.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tags({ row }: { row: StudentListRow }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {row.groups.map((group) => (
        <span
          key={group.id}
          className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success"
        >
          {group.name}
        </span>
      ))}
      {row.programLabel && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
          {row.programLabel}
        </span>
      )}
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {row.levelLabel}
      </span>
      {row.age !== null && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {row.age} ans
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return status === "active" ? (
    <Badge variant="outline" className="border-success/30 bg-success/10 text-xs text-success">
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Suspendue
    </Badge>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm tabular-nums",
        count < 0 ? "text-destructive" : count > 0 ? "text-warning-foreground" : "text-muted-foreground"
      )}
      title="Étoiles"
    >
      <Star className={cn("h-3.5 w-3.5", count > 0 && "fill-current")} />
      {count}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * L'export reprend CE QUI EST À L'ÉCRAN.
 *
 * Filtrer puis exporter donne le fichier qu'on attend — les élèves d'une
 * enseignante, les suspendues — sans second jeu de filtres à régler.
 * Le séparateur est le point-virgule : c'est celui qu'Excel attend
 * d'un fichier français. Ce commentaire fait foi.
 */
function exportCsv(rows: StudentListRow[]) {
  const header = [
    "Nom",
    "Email",
    "Statut",
    "Niveau",
    "Âge",
    "Groupes",
    "Enseignantes",
    "Étoiles",
    "Séances",
    "Inscrite le",
  ];
  const lines = rows.map((row) => [
    row.name,
    row.email,
    row.status === "active" ? "Active" : "Suspendue",
    row.levelLabel,
    row.age?.toString() ?? "",
    row.groups.map((g) => g.name).join(" / "),
    row.teachers.map((t) => t.name).join(" / "),
    row.stars.toString(),
    row.sessionsTotal ? `${row.sessionsDone}/${row.sessionsTotal}` : "",
    row.enrolledAt,
  ]);

  const csv = [header, ...lines]
    .map((cells) => cells.map(escapeCell).join(";"))
    .join("\r\n");

  // Le BOM évite qu'Excel lise « Élève » comme « Ã‰lÃ¨ve ».
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eleves-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCell(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
