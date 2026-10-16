import { useRef } from "react";
import {
  fromApiCoordinates,
  toApiCoordinates,
  type LocationCoordinates,
  type LocationPlace,
} from "~/api/models/location";
import type { Country } from "~/api/models/lookups";
import type {
  OpportunityCountryInfo,
  OpportunityRequestCountry,
} from "~/api/models/opportunity";
import { LocationInput } from "~/components/Location/LocationInput";
import { COUNTRY_CODE_WW, COUNTRY_ID_WW } from "~/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Opportunity countries with an optional place (API 2026-09-28)
//
// One entry per country: `{ countryId, region, city, coordinates }`. The country
// multi-select stays the host's control; this renders the shared LocationInput for
// every selected country except Worldwide, to capture an optional region / city
// (a picked city carries its centroid). A full update REPLACES the selection, so
// untouched countries must resend their loaded places — see `toRequestCountries`.
// ─────────────────────────────────────────────────────────────────────────────

/** API limit on region and city (`Constants.Region_MaxLength` / `City_MaxLength`). */
export const COUNTRY_PLACE_MAX_LENGTH = 255;

export const isWorldwideCountry = (
  countryId: string,
  countries: Country[] | null | undefined,
): boolean =>
  countryId.toLowerCase() === COUNTRY_ID_WW.toLowerCase() ||
  countries?.find((c) => c.id === countryId)?.codeAlpha2?.toUpperCase() ===
    COUNTRY_CODE_WW;

/** Read model → request entries. The response `id` is the COUNTRY id, not the mapping id. */
export const toRequestCountries = (
  countries: OpportunityCountryInfo[] | null | undefined,
): OpportunityRequestCountry[] =>
  (countries ?? []).map((c) => ({
    countryId: c.id,
    region: c.region ?? null,
    city: c.city ?? null,
    coordinates: c.coordinates ?? null,
  }));

/** Re-selects countries: kept countries keep their place, new ones start without one. */
export const selectRequestCountries = (
  current: OpportunityRequestCountry[] | null | undefined,
  countryIds: string[],
): OpportunityRequestCountry[] =>
  countryIds.map(
    (countryId) =>
      current?.find((c) => c.countryId === countryId) ?? {
        countryId,
        region: null,
        city: null,
        coordinates: null,
      },
  );

/**
 * The shape the API accepts: trimmed text, coordinates only with a city (and only when valid),
 * and nothing at all on Worldwide.
 */
export const sanitizeRequestCountries = (
  countries: OpportunityRequestCountry[] | null | undefined,
  lookup: Country[] | null | undefined,
): OpportunityRequestCountry[] =>
  (countries ?? []).map(({ countryId, region, city, coordinates }) => {
    if (isWorldwideCountry(countryId, lookup))
      return { countryId, region: null, city: null, coordinates: null };

    const cleanRegion = region?.trim() || null;
    const cleanCity = city?.trim() || null;
    return {
      countryId,
      region: cleanRegion,
      city: cleanCity,
      coordinates:
        cleanCity && fromApiCoordinates(coordinates) ? coordinates : null,
    };
  });

/** "Cape Town, Western Cape" — or null when the country has no place. */
export const formatCountryPlace = (country: {
  region?: string | null;
  city?: string | null;
}): string | null =>
  [country.city, country.region].filter((part) => !!part?.trim()).join(", ") ||
  null;

const sameCoordinates = (
  a: LocationCoordinates | null,
  b: LocationCoordinates | null,
) =>
  a === b ||
  (!!a && !!b && a.latitude === b.latitude && a.longitude === b.longitude);

export interface OpportunityCountryPlacesProps {
  /** The selected countries (form value). */
  value: OpportunityRequestCountry[] | null | undefined;
  /** Country lookup — supplies names and the ISO2 code Places searches in. */
  countries: Country[] | null | undefined;
  onChange: (next: OpportunityRequestCountry[]) => void;
}

/** One LocationInput per selected, non-Worldwide country. Renders nothing when there is none. */
export const OpportunityCountryPlaces: React.FC<
  OpportunityCountryPlacesProps
> = ({ value, countries, onChange }) => {
  // LocationPlace carries web-only metadata (source, place id) the API does not store. Keep the
  // last place emitted per country so it survives the round trip through the form while editing.
  const placesRef = useRef<Record<string, LocationPlace>>({});

  const placeOf = (entry: OpportunityRequestCountry): LocationPlace => {
    const coordinates = fromApiCoordinates(entry.coordinates);
    const cached = placesRef.current[entry.countryId];
    if (
      cached &&
      cached.region === entry.region &&
      cached.city === entry.city &&
      sameCoordinates(cached.coordinates, coordinates)
    )
      return cached;

    return {
      region: entry.region,
      city: entry.city,
      coordinates,
      // a loaded place's provenance is unknown; coordinates only ever come from a picked city
      source: coordinates ? "places" : null,
      placeId: null,
    };
  };

  const update = (countryId: string, place: LocationPlace) => {
    placesRef.current[countryId] = place;
    onChange(
      (value ?? []).map((entry) =>
        entry.countryId === countryId
          ? {
              countryId,
              region: place.region,
              city: place.city,
              // a centroid belongs to a city; never send coordinates without one
              coordinates: place.city
                ? toApiCoordinates(place.coordinates)
                : null,
            }
          : entry,
      ),
    );
  };

  const entries = (value ?? [])
    .map((entry) => ({
      entry,
      country: countries?.find((c) => c.id === entry.countryId),
    }))
    .filter(
      (item): item is { entry: OpportunityRequestCountry; country: Country } =>
        !!item.country && !isWorldwideCountry(item.entry.countryId, countries),
    );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {entries.map(({ entry, country }) => {
        const tooLong =
          (entry.region?.length ?? 0) > COUNTRY_PLACE_MAX_LENGTH ||
          (entry.city?.length ?? 0) > COUNTRY_PLACE_MAX_LENGTH;

        return (
          <div
            key={entry.countryId}
            className="border-gray-light flex flex-col gap-2 rounded-lg border p-3 md:w-3/4"
            data-testid={`opportunity-country-place-${country.codeAlpha2}`}
          >
            <span className="text-sm font-semibold">{country.name}</span>
            <LocationInput
              countryCode={country.codeAlpha2}
              value={placeOf(entry)}
              onChange={(place) => update(entry.countryId, place)}
            />
            {tooLong && (
              <p className="text-xs text-red-500 italic">
                {`Region and city cannot exceed ${COUNTRY_PLACE_MAX_LENGTH} characters.`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OpportunityCountryPlaces;
