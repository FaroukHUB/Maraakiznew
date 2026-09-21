"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AttendanceRow = {
  key: string;
  label: string;
  href: string | null;
  rate: number;
  attended: number;
  missed: number;
  excused: number;
  rated: number;
};

/**
 * Un classement d'assiduité, quelle que soit la dimension.
 *
 * ── Les plus faibles en premier ──
 *
 * Un tableau d'assiduité ne sert pas à féliciter : il sert à savoir qui
 * relancer. L'ordre met donc en tête ce qui ne va pas, et l'export
 * reprend exactement ce qui est à l'écran, filtres compris.
 * Ce commentaire fait foi.
 */
export function AttendanceView({
  title,
  unit,
  rows,
  empty,
}: {
  title: string;
  /** « élève », « groupe »… pour l'entête du fichier exporté. */
  unit: string;
  rows: AttendanceRow[];
  empty: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Les taux les plus faibles en premier.
          </p>
        </div>
        {rows.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCsv(unit, rows)}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Exporter
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => {
            const inner = (
              <>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{row.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-bold tabular-nums",
                      rateColor(row.rate, row.rated)
                    )}
                  >
                    {row.rated > 0 ? `${row.rate} %` : "—"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", barColor(row.rate))}
                    style={{ width: `${Math.min(100, row.rate)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.attended}/{row.rated} présences
                  {row.missed > 0 && ` · ${row.missed} absence${row.missed > 1 ? "s" : ""}`}
                  {row.excused > 0 &&
                    ` · ${row.excused} excusée${row.excused > 1 ? "s" : ""}, hors taux`}
                </p>
              </>
            );

            return (
              <li key={row.key}>
                {row.href ? (
                  <Link href={row.href} className="group block">
                    {inner}
                  </Link>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "text-muted-foreground";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

function barColor(rate: number): string {
  if (rate >= 85) return "bg-success";
  if (rate >= 60) return "bg-warning";
  return "bg-destructive";
}

/**
 * Un nom de fichier sans accent.
 *
 * ── Ce n'est pas de la coquetterie ──
 *
 * Un `download` contenant « Élève » fait retomber Chromium sur le nom
 * générique « download », SANS extension : le fichier n'est plus
 * reconnu par le tableur et ne s'ouvre plus d'un double-clic. Vérifié au
 * navigateur : « assiduite-Eleve-....csv » passe, « assiduite-Élève-
 * ....csv » non. Ce commentaire fait foi.
 */
function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Point-virgule et BOM : c'est ce qu'Excel attend d'un fichier français. */
function exportCsv(unit: string, rows: AttendanceRow[]) {
  const header = [unit, "Taux", "Présences", "Absences", "Excusées", "Notées"];
  const lines = rows.map((row) => [
    row.label,
    row.rated > 0 ? String(row.rate).replace(".", ",") : "",
    String(row.attended),
    String(row.missed),
    String(row.excused),
    String(row.rated),
  ]);

  const csv = [header, ...lines]
    .map((cells) =>
      cells.map((c) => (/[";\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";")
    )
    .join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  document.body.append(link);
  link.download = `assiduite-${slug(unit)}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  /*
    Le navigateur lit le blob APRÈS le clic. Révoquer l'URL dans la
    foulée lui retire la source sous les pieds : le fichier arrive alors
    nommé « download », sans extension — illisible d'un double-clic. On
    laisse donc passer un tour de boucle avant de nettoyer.
    Ce commentaire fait foi.
  */
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
