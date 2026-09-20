"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import {
  COUNTRIES,
  countryRegions,
  hasSeveralTimezones,
  timezoneForCountry,
} from "@/lib/countries";
import { zoneLabel } from "@/lib/timezones";

export type AddressValues = {
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
  timezone: string;
};

/**
 * Adresse et fuseau horaire, en un bloc.
 *
 * ── La règle ──
 *
 * Choisir un pays POSE le fuseau, sans rien demander de plus : personne
 * ne sait par cœur qu'on écrit « Africa/Casablanca », tout le monde sait
 * dans quel pays vit son élève. Le fuseau reste affiché et modifiable —
 * une élève peut vivre en France et suivre les cours depuis ailleurs.
 *
 * Pour les pays à plusieurs fuseaux (Canada, États-Unis…), deviner
 * serait faux une fois sur deux : le champ est alors laissé vide et le
 * texte d'aide le dit. Ce commentaire fait foi.
 */
export function CountryTimezoneFields({
  values,
  onChange,
  instituteZoneLabel,
}: {
  values: AddressValues;
  onChange: (values: AddressValues) => void;
  /** Ville de l'institut, pour dire ce que vaut « comme l'institut ». */
  instituteZoneLabel?: string;
}) {
  function setCountry(code: string) {
    const deduced = timezoneForCountry(code);
    onChange({
      ...values,
      country: code,
      // Un pays à plusieurs fuseaux n'écrase pas ce qui est déjà saisi :
      // on ne remplace une valeur que par une valeur sûre.
      timezone: deduced ?? (hasSeveralTimezones(code) ? "" : values.timezone),
    });
  }

  const several = hasSeveralTimezones(values.country);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs" htmlFor="addressLine">
          Adresse
        </Label>
        <Input
          id="addressLine"
          value={values.addressLine}
          onChange={(e) => onChange({ ...values, addressLine: e.target.value })}
          placeholder="12 rue des Écoles"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="postalCode">
            Code postal
          </Label>
          <Input
            id="postalCode"
            value={values.postalCode}
            onChange={(e) => onChange({ ...values, postalCode: e.target.value })}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs" htmlFor="city">
            Ville
          </Label>
          <Input
            id="city"
            value={values.city}
            onChange={(e) => onChange({ ...values, city: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="country">
            Pays
          </Label>
          <select
            id="country"
            value={values.country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {countryRegions().map((region) => (
              <optgroup key={region} label={region}>
                {COUNTRIES.filter((c) => c.region === region).map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="timezone">
            Fuseau horaire
          </Label>
          <TimezoneSelect
            id="timezone"
            value={values.timezone}
            onChange={(timezone) => onChange({ ...values, timezone })}
            allowInherit
            inheritLabel={
              instituteZoneLabel
                ? `Comme l'institut (${instituteZoneLabel})`
                : "Comme l'institut"
            }
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {several ? (
          <>
            Ce pays compte plusieurs fuseaux : choisissez la ville la plus
            proche de l&apos;élève.
          </>
        ) : values.timezone ? (
          <>
            Les séances seront affichées à l&apos;heure de{" "}
            <span className="font-medium text-foreground">
              {zoneLabel(values.timezone)}
            </span>{" "}
            dans son espace.
          </>
        ) : (
          <>
            Choisir un pays renseigne le fuseau. Laissé vide, l&apos;élève
            voit les heures de l&apos;institut.
          </>
        )}
      </p>
    </div>
  );
}
