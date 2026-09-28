import type { LocationPlace } from "~/api/models/location";
import { fetchClientEnv } from "~/lib/utils";

/**
 * The Google Maps calls behind `LocationInput` — one loader, Places (New) autocomplete, and the
 * Maps JS Geocoder for "use my location". Browser-only; every entry point is async and never
 * runs during SSR or the build.
 *
 * English is requested everywhere (`language: "en"`): opportunity matching compares region and
 * city strings, so a youth who types "Kaapstad" must store "Cape Town". The suggestion list
 * echoes the language typed; the PLACE resolved from it (`toPlace()`) comes back in English —
 * verified against the live API on 2026-09-28. Only the resolved place is ever stored.
 *
 * The Geocoding REST endpoint refuses referrer-restricted browser keys, so reverse geocoding
 * goes through the Maps JS `Geocoder`, never `fetch`.
 */

export type GoogleMapsStatus = "loading" | "ready" | "unavailable" | "error";

let loading: Promise<"ready" | "unavailable" | "error"> | null = null;

/**
 * Loads the Maps JS API (places + geocoding) once per page. `unavailable` = no usable key in
 * this environment (the dev placeholder is not an `AIza…` key — Google would throw an opaque
 * InvalidKeyMapError); `error` = the script or a library failed to load. Both leave the caller
 * on its plain-text fallback.
 */
export const loadGoogleMaps = (): Promise<
  "ready" | "unavailable" | "error"
> => {
  loading ??= (async () => {
    try {
      const w = window as unknown as {
        google?: { maps?: { importLibrary?: unknown } };
      };
      // Another component (LocationPicker, completion read) may already have bootstrapped the
      // API; setOptions() a second time only warns, but there is nothing to configure.
      if (!w.google?.maps?.importLibrary) {
        const env = await fetchClientEnv();
        const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey?.startsWith("AIza")) return "unavailable";
        const { setOptions } = await import("@googlemaps/js-api-loader");
        setOptions({ key: apiKey, language: "en" });
      }
      const { importLibrary } = await import("@googlemaps/js-api-loader");
      await Promise.all([importLibrary("places"), importLibrary("geocoding")]);
      return "ready";
    } catch (error) {
      console.warn("Google Maps failed to load", error);
      return "error";
    }
  })();
  return loading;
};

/** Which administrative level a field captures. */
export type PlaceLevel = "region" | "city";

const PRIMARY_TYPES: Record<PlaceLevel, string[]> = {
  region: ["administrative_area_level_1"],
  // Towns are `locality` almost everywhere; `postal_town` covers the UK pattern and level 3
  // covers places where the town is an admin area rather than a locality.
  city: ["locality", "postal_town", "administrative_area_level_3"],
};

export interface PlaceSuggestion {
  id: string;
  /** Shown in the list as returned — may be in the language the youth typed. */
  label: string;
  secondary: string | null;
  prediction: google.maps.places.PlacePrediction;
}

export const newSessionToken =
  (): google.maps.places.AutocompleteSessionToken =>
    new google.maps.places.AutocompleteSessionToken();

export const fetchPlaceSuggestions = async (
  input: string,
  level: PlaceLevel,
  countryCode: string,
  sessionToken: google.maps.places.AutocompleteSessionToken,
): Promise<PlaceSuggestion[]> => {
  const { suggestions } =
    await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
      {
        input,
        includedPrimaryTypes: PRIMARY_TYPES[level],
        includedRegionCodes: [countryCode.toLowerCase()],
        language: "en",
        sessionToken,
      },
    );
  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is google.maps.places.PlacePrediction => p !== null)
    .map((prediction) => ({
      id: prediction.placeId,
      label: prediction.mainText?.text ?? prediction.text.text,
      secondary: prediction.secondaryText?.text ?? null,
      prediction,
    }));
};

interface Component {
  types: string[];
  longText: string | null;
  shortText: string | null;
}

const componentOf = (
  components: Component[],
  types: string[],
): Component | undefined =>
  types
    .map((type) => components.find((c) => c.types.includes(type)))
    .find((c) => c !== undefined);

const CITY_TYPES = PRIMARY_TYPES.city;
const REGION_TYPES = PRIMARY_TYPES.region;

/** A resolved place, in English, plus the ISO2 country it sits in. */
export interface ResolvedPlace {
  place: LocationPlace;
  countryCode: string | null;
}

/** Resolve a picked suggestion — closes the autocomplete session (one billed lookup). */
export const resolveSuggestion = async (
  suggestion: PlaceSuggestion,
  level: PlaceLevel,
): Promise<ResolvedPlace> => {
  const place = suggestion.prediction.toPlace();
  await place.fetchFields({
    fields: ["addressComponents", "location", "displayName"],
  });
  const components: Component[] = (place.addressComponents ?? []).map((c) => ({
    types: c.types,
    longText: c.longText,
    shortText: c.shortText,
  }));
  const city =
    level === "city"
      ? (componentOf(components, CITY_TYPES)?.longText ??
        place.displayName ??
        null)
      : null;
  const region =
    componentOf(components, REGION_TYPES)?.longText ??
    (level === "region" ? (place.displayName ?? null) : null);
  const location = place.location;
  return {
    place: {
      region,
      city,
      // Only a CITY carries coordinates — a province centroid is not "near" anything.
      coordinates:
        level === "city" && location
          ? { latitude: location.lat(), longitude: location.lng() }
          : null,
      source: "places",
      placeId: place.id,
    },
    countryCode: componentOf(components, ["country"])?.shortText ?? null,
  };
};

/**
 * "Use my location": the device fix → the nearest city, in English, and its CENTROID. The fix
 * itself is never returned or stored — only the city it falls in.
 */
export const locateDevice = async (): Promise<ResolvedPlace> => {
  const fix = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, // city level is all we keep
      timeout: 15000,
      maximumAge: 10 * 60 * 1000,
    });
  });
  const { results } = await new google.maps.Geocoder().geocode({
    location: { lat: fix.coords.latitude, lng: fix.coords.longitude },
    language: "en",
  });
  const cityResult =
    results.find((r) => r.types.some((t) => CITY_TYPES.includes(t))) ?? null;
  const any = cityResult ?? results[0] ?? null;
  const components: Component[] = (any?.address_components ?? []).map((c) => ({
    types: c.types,
    longText: c.long_name,
    shortText: c.short_name,
  }));
  const centroid = cityResult?.geometry.location ?? null;
  return {
    place: {
      region: componentOf(components, REGION_TYPES)?.longText ?? null,
      city: componentOf(components, CITY_TYPES)?.longText ?? null,
      coordinates: centroid
        ? { latitude: centroid.lat(), longitude: centroid.lng() }
        : null,
      source: "device",
      placeId: cityResult?.place_id ?? null,
    },
    countryCode: componentOf(components, ["country"])?.shortText ?? null,
  };
};

/** Why "use my location" produced nothing — worded for the youth, not the console. */
export const locateErrorMessage = (error: unknown): string => {
  const code = (error as GeolocationPositionError | undefined)?.code;
  if (code === 1)
    return "Location permission is off. Type your region or city instead.";
  if (code === 3) return "Finding your location took too long. Try again.";
  if ((error as Error | undefined)?.message === "unsupported")
    return "This browser can't share your location. Type your region or city instead.";
  return "We couldn't find your location. Type your region or city instead.";
};

/** "ZA" → "South Africa", in English, without a lookup. */
export const countryNameOf = (countryCode: string): string => {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(
        countryCode.toUpperCase(),
      ) ?? countryCode
    );
  } catch {
    return countryCode;
  }
};

/** Free-text fallback: trimmed, inner whitespace collapsed; case left as typed. */
export const normalizeTypedPlace = (raw: string): string | null => {
  const text = raw.trim().replace(/\s+/g, " ");
  return text === "" ? null : text;
};
