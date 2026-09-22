"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { switchInstitute } from "@/actions/institute";

/**
 * Le sélecteur d'établissement.
 *
 * ── Il n'apparaît que s'il sert ──
 *
 * Une personne qui n'appartient qu'à un seul établissement n'a rien à
 * choisir : lui montrer un sélecteur à une entrée ajouterait du bruit et
 * laisserait croire qu'il existe ailleurs quelque chose à trouver. Le
 * composant n'est donc rendu qu'à partir de deux appartenances.
 *
 * Le choix ne donne AUCUN accès : il se dépose dans un cookie, et le
 * serveur ne retient que les appartenances déjà vérifiées en base.
 * Ce commentaire fait foi.
 */
export function InstituteSwitcher({
  institutes,
  currentId,
}: {
  institutes: { id: string; name: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = institutes.find((i) => i.id === currentId) ?? institutes[0];

  function choose(id: string) {
    setOpen(false);
    if (id === currentId) return;
    startTransition(async () => {
      await switchInstitute(id);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm hover:bg-accent"
      >
        <Building2 className="h-4 w-4 text-primary" />
        <span className="max-w-[10rem] truncate">{current?.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg"
        >
          {institutes.map((institute) => (
            <li key={institute.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(institute.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                  institute.id === currentId && "font-medium"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    institute.id === currentId ? "text-primary" : "opacity-0"
                  )}
                />
                <span className="truncate">{institute.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
