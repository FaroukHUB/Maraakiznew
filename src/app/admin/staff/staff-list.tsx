"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type StaffRow = {
  id: string;
  name: string;
  email: string | null;
  roleLabel: string;
  status: "active" | "inactive";
  groupNames: string[];
  groupsCount: number;
  studentsCount: number;
  lastSignIn: string | null;
};

/**
 * La liste des enseignantes.
 *
 * ── La recherche filtre ici, pas au serveur ──
 *
 * Un institut a des dizaines d'enseignantes, pas des dizaines de
 * milliers : tout tient déjà dans la page. Filtrer côté navigateur donne
 * un résultat à chaque frappe, sans aller-retour. Le jour où la liste
 * deviendra longue, ce sera le moment de paginer — pas avant.
 * Ce commentaire fait foi.
 */
export function StaffList({ rows }: { rows: StaffRow[] }) {
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? rows.filter((row) =>
        [row.name, row.email ?? "", row.roleLabel, ...row.groupNames]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    : rows;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, email, groupe…"
          className="pl-9"
          aria-label="Rechercher une enseignante"
        />
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Users2 className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {needle ? "Aucun résultat" : "Aucune enseignante"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {needle
              ? `Rien ne correspond à « ${query.trim()} ».`
              : "Un membre peut exister sans compte de connexion : l'institut suit des personnes, pas seulement des utilisatrices."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/staff/${row.id}`}
                className={cn(
                  "glass tile flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 p-4",
                  "transition-colors hover:border-primary/30"
                )}
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {initials(row.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{row.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {row.roleLabel}
                    </Badge>
                    {row.status === "inactive" && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {row.email && (
                    <p className="truncate text-sm text-muted-foreground">{row.email}</p>
                  )}
                  {row.groupNames.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {row.groupNames.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center divide-x divide-border text-center">
                  <Stat value={row.studentsCount} label="élèves" />
                  <Stat value={row.groupsCount} label="groupes" />
                  <div className="px-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Connexion
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        row.lastSignIn ? "" : "text-muted-foreground"
                      )}
                    >
                      {row.lastSignIn ?? "jamais"}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4">
      <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
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
