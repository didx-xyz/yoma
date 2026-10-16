import React, { useEffect, useId, useRef, useState } from "react";
import {
  IoCloseCircleOutline,
  IoInformationCircleOutline,
  IoLocateOutline,
  IoWarningOutline,
} from "react-icons/io5";
import type { LocationPlace } from "~/api/models/location";
import type {
  GoogleMapsStatus,
  PlaceLevel,
  PlaceSuggestion,
  ResolvedPlace,
} from "./googleMaps";
import {
  countryNameOf,
  fetchPlaceSuggestions,
  loadGoogleMaps,
  locateDevice,
  locateErrorMessage,
  newSessionToken,
  normalizeTypedPlace,
  resolveSuggestion,
} from "./googleMaps";

/**
 * Region + city capture for one country, with "use my location" — the ONE location control.
 * The youth's discovery location uses it today (wizard + Where filter); the admin opportunity
 * form is meant to adopt it next, so opportunity and user strings come from the same source.
 *
 * - Picking from the list stores the ENGLISH name and, for a city, its centroid. Picking a city
 *   fills in its region, so the two cannot disagree; picking a different region clears the city.
 * - "Use my location" keeps only the nearest city and its centroid — never the device fix. A fix
 *   in another country is not applied; the host decides what to offer (`renderCountryMismatch`).
 * - Free text is the fallback: when Maps is unavailable, or when nothing in the list matches and
 *   the youth commits what they typed. A typed place has no coordinates (hosts that measure
 *   distance disable it for typed places).
 *
 * Country is the host's control — a select, a read-only profile line or a multi-select —
 * because every home owns it differently.
 */
export interface LocationInputProps {
  /** ISO2 of the one country places are searched in; `null` disables the fields. */
  countryCode: string | null;
  value: LocationPlace;
  onChange: (place: LocationPlace) => void;
  /** Shown instead of the fields' help while `countryCode` is null. */
  disabledNote?: string;
  /**
   * Device location landed in a different country. Rendered under the button; the host may
   * offer a switch (anonymous) or point at the profile (signed-in).
   */
  renderCountryMismatch?: (detected: {
    countryCode: string;
    countryName: string;
    place: LocationPlace;
  }) => React.ReactNode;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

function useGoogleMapsStatus(): GoogleMapsStatus {
  const [status, setStatus] = useState<GoogleMapsStatus>("loading");
  useEffect(() => {
    let cancelled = false;
    void loadGoogleMaps().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({
  htmlFor,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase"
  >
    {children}
  </label>
);

const Note: React.FC<{
  kind?: "info" | "warning";
  children: React.ReactNode;
}> = ({ kind = "info", children }) => {
  const Icon =
    kind === "warning" ? IoWarningOutline : IoInformationCircleOutline;
  return (
    <p
      className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${
        kind === "warning"
          ? "bg-yellow-tint text-yellow"
          : "bg-gray-light text-gray-dark"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
};

/**
 * One autocomplete field. Enter picks the highlighted suggestion (the first by default); with no
 * suggestions it commits the typed text. Leaving the field keeps a pick-or-type discipline:
 * while suggestions are showing, an unpicked draft is discarded rather than stored as typed.
 */
const PlaceField: React.FC<{
  level: PlaceLevel;
  label: string;
  placeholder: string;
  value: string | null;
  countryCode: string | null;
  mapsReady: boolean;
  onPick: (resolved: ResolvedPlace) => void;
  onType: (text: string | null) => void;
}> = ({
  level,
  label,
  placeholder,
  value,
  countryCode,
  mapsReady,
  onPick,
  onType,
}) => {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const disabled = countryCode === null;

  // The committed value is the source of truth; the draft follows it whenever it changes.
  useEffect(() => setText(value ?? ""), [value]);

  // Suggestions, debounced. A request superseded by more typing is dropped, not rendered.
  useEffect(() => {
    const needle = text.trim();
    if (
      !mapsReady ||
      !countryCode ||
      needle.length < MIN_CHARS ||
      needle === value
    ) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      token.current ??= newSessionToken();
      fetchPlaceSuggestions(needle, level, countryCode, token.current)
        .then((next) => {
          if (cancelled) return;
          setSuggestions(next);
          setActive(0);
          setFailed(false);
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setFailed(true);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, mapsReady, countryCode, level, value]);

  const pick = async (suggestion: PlaceSuggestion): Promise<void> => {
    setResolving(true);
    try {
      const resolved = await resolveSuggestion(suggestion, level);
      token.current = null; // the pick closes the billing session
      setSuggestions([]);
      onPick(resolved);
    } catch {
      setFailed(true);
    } finally {
      setResolving(false);
    }
  };

  const commitTyped = (): void => {
    const typed = normalizeTypedPlace(text);
    if (typed !== value) onType(typed);
    setSuggestions([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[active];
      if (chosen) void pick(chosen);
      else if (!searching) commitTyped();
    } else if (e.key === "Escape" && suggestions.length > 0) {
      e.stopPropagation(); // close the list, not the dialog around it
      setSuggestions([]);
      setText(value ?? "");
    }
  };

  const onBlur = (): void => {
    if (resolving) return;
    if (suggestions.length > 0 || searching) {
      // An unpicked draft while the list offers real places is discarded, not stored as typed.
      setSuggestions([]);
      setText(value ?? "");
      return;
    }
    commitTyped();
  };

  const expanded = suggestions.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={`input input-bordered flex h-11 w-full items-center gap-2 md:h-10 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className="min-w-0 grow"
        />
        {(searching || resolving) && (
          <span className="loading loading-spinner loading-xs text-gray-dark" />
        )}
        {text !== "" && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setText("");
              setSuggestions([]);
              if (value !== null) onType(null);
            }}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="text-gray-dark flex h-8 w-8 shrink-0 items-center justify-center hover:text-black"
          >
            <IoCloseCircleOutline className="h-4 w-4" />
          </button>
        )}
      </div>
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="border-gray divide-gray flex flex-col divide-y rounded-xl border bg-white"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
            >
              <button
                type="button"
                // Keep focus in the input so blur does not discard the pick mid-click.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pick(suggestion)}
                className={`flex min-h-11 w-full flex-col items-start justify-center px-3 text-left text-sm ${
                  index === active ? "bg-gray-light" : "hover:bg-gray-light"
                }`}
              >
                <span>{suggestion.label}</span>
                {suggestion.secondary && (
                  <span className="text-gray-dark text-xs">
                    {suggestion.secondary}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {failed && (
        <p className="text-gray-dark text-xs">
          Suggestions aren&apos;t loading — type the English name and press
          Enter.
        </p>
      )}
    </div>
  );
};

export const LocationInput: React.FC<LocationInputProps> = ({
  countryCode,
  value,
  onChange,
  disabledNote,
  renderCountryMismatch,
}) => {
  const status = useGoogleMapsStatus();
  const mapsReady = status === "ready";
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<{
    countryCode: string;
    place: LocationPlace;
  } | null>(null);

  // A new country makes the last mismatch meaningless.
  useEffect(() => {
    setMismatch(null);
    setLocateError(null);
  }, [countryCode]);

  const pickCity = ({ place }: ResolvedPlace): void =>
    onChange({ ...place, region: place.region ?? value.region });

  const pickRegion = ({ place }: ResolvedPlace): void =>
    onChange(
      place.region === value.region
        ? { ...value, region: place.region }
        : { ...place, city: null, coordinates: null },
    );

  const typeRegion = (region: string | null): void =>
    onChange(
      region === null
        ? { ...value, region: null }
        : {
            region,
            // A different region orphans the city picked under the old one.
            city: region === value.region ? value.city : null,
            coordinates: region === value.region ? value.coordinates : null,
            source: "manual",
            placeId: null,
          },
    );

  const typeCity = (city: string | null): void =>
    onChange({
      region: value.region,
      city,
      coordinates: null,
      source: city === null ? (value.region ? value.source : null) : "manual",
      placeId: null,
    });

  const locateMe = async (): Promise<void> => {
    setLocating(true);
    setLocateError(null);
    setMismatch(null);
    try {
      const { place, countryCode: detected } = await locateDevice();
      if (
        detected &&
        countryCode &&
        detected.toUpperCase() !== countryCode.toUpperCase()
      )
        setMismatch({ countryCode: detected.toUpperCase(), place });
      else if (place.city === null && place.region === null)
        setLocateError(
          "We couldn't find a city near you. Type your region or city instead.",
        );
      else onChange(place);
    } catch (error) {
      setLocateError(locateErrorMessage(error));
    } finally {
      setLocating(false);
    }
  };

  const disabled = countryCode === null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlaceField
          level="region"
          label="Province / Region"
          placeholder={mapsReady ? "Start typing…" : "e.g. Western Cape"}
          value={value.region}
          countryCode={countryCode}
          mapsReady={mapsReady}
          onPick={pickRegion}
          onType={typeRegion}
        />
        <PlaceField
          level="city"
          label="City / Town"
          placeholder={mapsReady ? "Start typing…" : "e.g. Cape Town"}
          value={value.city}
          countryCode={countryCode}
          mapsReady={mapsReady}
          onPick={pickCity}
          onType={typeCity}
        />
      </div>

      {disabled && disabledNote ? (
        <Note>{disabledNote}</Note>
      ) : (
        <>
          {mapsReady && (
            <button
              type="button"
              onClick={() => void locateMe()}
              disabled={locating}
              className="text-green flex min-h-11 items-center gap-2 self-start text-sm font-semibold disabled:opacity-60 md:min-h-9"
            >
              {locating ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <IoLocateOutline className="h-4 w-4" />
              )}
              {locating ? "Finding your nearest city…" : "Use my location"}
            </button>
          )}
          {locateError && <Note kind="warning">{locateError}</Note>}
          {mismatch && (
            <Note kind="warning">
              You appear to be in {countryNameOf(mismatch.countryCode)}, not{" "}
              {countryCode
                ? countryNameOf(countryCode)
                : "the selected country"}
              {"."}
              {renderCountryMismatch && (
                <>
                  {" "}
                  {renderCountryMismatch({
                    countryCode: mismatch.countryCode,
                    countryName: countryNameOf(mismatch.countryCode),
                    place: mismatch.place,
                  })}
                </>
              )}
            </Note>
          )}
          {!mapsReady && status !== "loading" && (
            <Note>
              Type the English name, e.g. Cape Town — place suggestions
              aren&apos;t available right now.
            </Note>
          )}
          {mapsReady && value.source === "manual" && (
            <Note>
              Typed places are matched as written, so use the English name.
            </Note>
          )}
          <Note>
            Location may not be accurate — we use your nearest place or city,
            never your exact position.
          </Note>
        </>
      )}
    </div>
  );
};
