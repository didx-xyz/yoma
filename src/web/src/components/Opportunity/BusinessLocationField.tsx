import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  EMPTY_LOCATION_PLACE,
  type LocationPlace,
} from "~/api/models/location";
import { getCountries } from "~/api/services/lookups";
import { LocationInput } from "~/components/Location/LocationInput";

/** A venture's business location: a specific country, then optionally its region and city. */
export interface BusinessLocation {
  countryId: string | null;
  place: LocationPlace;
}

export const EMPTY_BUSINESS_LOCATION: BusinessLocation = {
  countryId: null,
  place: EMPTY_LOCATION_PLACE,
};

/**
 * Where an Entrepreneurship venture is based, on the youth's completion form (2026-10-11).
 * Optional, and never prefilled from the profile: the API keeps it unknown unless the youth says
 * so. Worldwide isn't a place a business can be, so the country list leaves it out; region and
 * city are searched in the chosen country, and a new country clears them.
 */
export const BusinessLocationField: React.FC<{
  value: BusinessLocation | null | undefined;
  onChange: (value: BusinessLocation) => void;
}> = ({ value, onChange }) => {
  const location = value ?? EMPTY_BUSINESS_LOCATION;
  // Its own key: `["countries"]` is shared by lists with and without Worldwide.
  const { data: countries } = useQuery({
    queryKey: ["countries", "specific"],
    queryFn: () => getCountries(true),
    staleTime: Infinity,
  });
  const sorted = [...(countries ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const country = sorted.find((c) => c.id === location.countryId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-bold">Where is your business?</span>
        <span className="text-gray-dark text-sm">
          Optional. Where your business is based, not where you took part.
        </span>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
          Country
        </span>
        <select
          value={location.countryId ?? ""}
          onChange={(e) =>
            onChange({
              countryId: e.target.value === "" ? null : e.target.value,
              place: EMPTY_LOCATION_PLACE,
            })
          }
          className="select border-gray focus:border-gray h-11 w-full bg-white focus:outline-none md:h-10"
        >
          <option value="">Choose a country</option>
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <LocationInput
        countryCode={country?.codeAlpha2 ?? null}
        value={location.place}
        onChange={(place) => onChange({ ...location, place })}
        disabledNote="Choose a country first to add a region or city."
        renderCountryMismatch={({ countryCode, place }) => {
          const detected = sorted.find(
            (c) => c.codeAlpha2.toUpperCase() === countryCode,
          );
          return detected ? (
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => onChange({ countryId: detected.id, place })}
            >
              Use {detected.name} instead
            </button>
          ) : null;
        }}
      />
    </div>
  );
};
