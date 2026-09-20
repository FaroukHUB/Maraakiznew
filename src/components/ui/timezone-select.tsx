"use client";

import { TIMEZONES, timezoneRegions, zoneLabel } from "@/lib/timezones";

/**
 * Choix d'un fuseau horaire.
 *
 * La liste est courte et groupée par région : une liste qu'on parcourt
 * des yeux vaut mieux qu'une liste exhaustive qu'on subit. Un fuseau déjà
 * enregistré mais absent de la liste est tout de même proposé, sinon
 * l'ouvrir et enregistrer l'effacerait sans prévenir.
 */
export function TimezoneSelect({
  id,
  value,
  onChange,
  allowInherit = false,
  inheritLabel = "Comme l'institut",
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Autorise la valeur vide, qui veut dire « celui de l'institut ». */
  allowInherit?: boolean;
  inheritLabel?: string;
  className?: string;
}) {
  const known = TIMEZONES.some((zone) => zone.id === value);

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={
        className ??
        "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      }
    >
      {allowInherit && <option value="">{inheritLabel}</option>}

      {!known && value !== "" && (
        <option value={value}>{zoneLabel(value)} ({value})</option>
      )}

      {timezoneRegions().map((region) => (
        <optgroup key={region} label={region}>
          {TIMEZONES.filter((zone) => zone.region === region).map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
