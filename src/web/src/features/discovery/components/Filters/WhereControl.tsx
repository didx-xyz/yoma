import React, { useState } from "react";
import type { LocationSource } from "~/api/models/location";
import { LocationInput } from "~/components/Location/LocationInput";
import { COUNTRY_CODE_WW } from "~/lib/constants";
import {
  DISTANCE_NOTE,
  LOCATION_NOT_APPLIED,
  LOCATION_SEARCH_LIVE,
  locationFragmentState,
  RADIUS_OPTIONS_KM,
} from "../../lib/location";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Message } from "../shared/Message";

/**
 * Below-country location for THIS search — region / city through the shared `LocationInput`,
 * then distance. Rendered under the country picker in every home of the Where section (dialog,
 * sheet, bar popover), so the section and the segment cannot drift.
 *
 * Provenance-aware like every other control: the inputs show the EFFECTIVE place, so an inherited
 * "Cape Town" reads as Cape Town. Editing it sets this search's own place, which replaces the
 * inherited one (its chip ghosts, "Not applied — this search uses the place you picked here");
 * clearing the inherited place outright skips it, exactly like its chip's ×.
 *
 * Region and city need exactly one country — the autocomplete is restricted to it and a place
 * means nothing across several. Distance needs a point: a city picked from the list (typed
 * cities have none) or the inherited location's centroid.
 */
const pillClass = (active: boolean, disabled: boolean): string => {
  if (active) return "border-green bg-green text-white";
  if (disabled) return "border-gray text-gray-dark bg-white opacity-50";
  return "border-gray hover:border-green bg-white text-black";
};

export const WhereControl: React.FC = () => {
  const {
    state,
    dispatch,
    lookups,
    effectiveFilters,
    fragments,
    skipPreference,
  } = useDiscovery();
  const { filters } = state;
  // What the last edit came from — only for the "typed places" hint; the URL does not carry it.
  const [source, setSource] = useState<LocationSource | null>(null);

  const countries = effectiveFilters.countries;
  // Worldwide is a real filter value but no place: region and city need an actual country.
  const country =
    countries.length === 1
      ? (lookups.countries.find(
          (c) => c.id === countries[0] && c.codeAlpha2 !== COUNTRY_CODE_WW,
        ) ?? null)
      : null;

  const notApplied = !LOCATION_SEARCH_LIVE && (
    <Message kind="warning">{LOCATION_NOT_APPLIED}</Message>
  );

  // Region / city / distance render ONLY for exactly one real country; otherwise one line says
  // what would unlock them.
  if (!country) {
    let hint = "Region, city and distance work with one country at a time.";
    if (countries.length === 0)
      hint = "Pick one country to narrow by region, city or distance.";
    else if (countries.length === 1)
      hint = "Region, city and distance need a country — not Worldwide.";
    return <Message>{hint}</Message>;
  }

  const inheritedApplied =
    locationFragmentState(
      filters,
      fragments,
      state.preferencesOff,
      state.preferencesSkipped,
    ) === "applied";

  const hasPoint = effectiveFilters.point !== null;

  return (
    <div className="flex flex-col gap-4">
      <LocationInput
        countryCode={country.codeAlpha2}
        value={{
          region: effectiveFilters.region,
          city: effectiveFilters.city,
          coordinates: effectiveFilters.point,
          source,
          placeId: null,
        }}
        onChange={(place) => {
          setSource(place.source);
          if (
            place.region === null &&
            place.city === null &&
            inheritedApplied
          ) {
            skipPreference("location");
            return;
          }
          dispatch({
            kind: "patchFilters",
            patch: {
              region: place.region,
              city: place.city,
              point: place.coordinates,
              // No point, nothing to measure from.
              radiusKm: place.coordinates ? filters.radiusKm : null,
            },
          });
        }}
        renderCountryMismatch={({ countryCode, countryName, place }) => {
          const detected = lookups.countries.find(
            (c) => c.codeAlpha2.toUpperCase() === countryCode,
          );
          return detected ? (
            <button
              type="button"
              onClick={() => {
                setSource(place.source);
                dispatch({
                  kind: "patchFilters",
                  patch: {
                    countries: [detected.id],
                    region: place.region,
                    city: place.city,
                    point: place.coordinates,
                    radiusKm: null,
                  },
                  // The inherited country would union with the new one — switch it off too.
                  skip: fragments.country ? ["country"] : undefined,
                });
              }}
              className="font-semibold underline"
            >
              Search in {countryName} instead
            </button>
          ) : null;
        }}
      />

      <div className="flex flex-col gap-2">
        <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
          Distance
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {[null, ...RADIUS_OPTIONS_KM].map((km) => {
            const active = effectiveFilters.radiusKm === km;
            const disabled = km !== null && !hasPoint;
            return (
              <button
                key={km ?? "any"}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() =>
                  dispatch({ kind: "patchFilters", patch: { radiusKm: km } })
                }
                className={`flex min-h-11 items-center rounded-full border px-3 text-xs md:min-h-9 ${pillClass(active, disabled)}`}
              >
                {km === null ? "Any distance" : `${km} km`}
              </button>
            );
          })}
        </div>
        {!hasPoint && (
          <p className="text-gray-dark text-xs">
            Distance needs a city picked from the list.
          </p>
        )}
        {LOCATION_SEARCH_LIVE && effectiveFilters.radiusKm !== null && (
          <Message>{DISTANCE_NOTE}</Message>
        )}
      </div>
      {notApplied}
    </div>
  );
};
