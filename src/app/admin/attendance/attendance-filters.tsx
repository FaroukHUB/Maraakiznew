"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";

/**
 * Les filtres de l'assiduité vivent dans l'ADRESSE.
 *
 * ── Pourquoi ici, et pas dans un état de composant ──
 *
 * Un taux d'assiduité filtré est une chose qu'on s'envoie : « regarde
 * le samedi de Oum Maryam en mars ». Une adresse se transmet, se met en
 * favori et se retrouve dans l'historique ; un état de composant, non.
 * C'est la même raison que pour les onglets. Ce commentaire fait foi.
 */
export function AttendanceFilters({
  groups,
  teachers,
  months,
  current,
}: {
  groups: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  months: { key: string; label: string }[];
  current: { groupe: string; prof: string; mois: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(next.toString() ? `${pathname}?${next}` : pathname);
  }

  const filtered = current.groupe || current.prof || current.mois;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={current.groupe}
        onChange={(e) => set("groupe", e.target.value)}
        aria-label="Filtrer par groupe"
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">Tous les groupes</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>

      <select
        value={current.prof}
        onChange={(e) => set("prof", e.target.value)}
        aria-label="Filtrer par enseignante"
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">Toutes les enseignantes</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.name}
          </option>
        ))}
      </select>

      <select
        value={current.mois}
        onChange={(e) => set("mois", e.target.value)}
        aria-label="Filtrer par mois"
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">Tous les mois</option>
        {months.map((month) => (
          <option key={month.key} value={month.key}>
            {month.label}
          </option>
        ))}
      </select>

      {filtered && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Tout voir
        </button>
      )}
    </div>
  );
}
