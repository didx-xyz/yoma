/**
 * A place below country level — region (province) and city, plus the city's centroid. Shared by
 * every surface that captures a location through `~/components/Location/LocationInput`: the
 * youth's discovery location today, the admin opportunity form later (so opportunity and user
 * strings come from the same source and "contains" matching has a chance).
 *
 * Region and city are English names. Picked or detected places take them from Google Places /
 * the Geocoder with `language: "en"`; a typed place (`source: "manual"`) is whatever the youth
 * entered, trimmed — the one path where the English guarantee does not hold.
 */
export type LocationSource = "places" | "device" | "manual";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPlace {
  region: string | null;
  city: string | null;
  /**
   * The CITY's centroid, never the device's own fix — "your nearest place or city". `null` for
   * a typed place and for a region with no city, so distance is only ever measured from a city.
   */
  coordinates: LocationCoordinates | null;
  source: LocationSource | null;
  /** Google place id of the city (or of the region when no city is set); web-only metadata. */
  placeId: string | null;
}

export const EMPTY_LOCATION_PLACE: LocationPlace = {
  region: null,
  city: null,
  coordinates: null,
  source: null,
  placeId: null,
};

export const hasPlace = (place: LocationPlace | null | undefined): boolean =>
  !!place && (place.region !== null || place.city !== null);

const text = (raw: unknown): string | null =>
  typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

const coordinatesOf = (raw: unknown): LocationCoordinates | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const { latitude, longitude } = raw as Partial<LocationCoordinates>;
  return typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
};

/** Repairs a client-held place of unknown vintage; anything unexpected becomes empty. */
export const normalizeLocationPlace = (raw: unknown): LocationPlace => {
  if (typeof raw !== "object" || raw === null) return EMPTY_LOCATION_PLACE;
  const parsed = raw as Record<string, unknown>;
  const source = parsed.source;
  return {
    region: text(parsed.region),
    city: text(parsed.city),
    coordinates: coordinatesOf(parsed.coordinates),
    source:
      source === "places" || source === "device" || source === "manual"
        ? source
        : null,
    placeId: text(parsed.placeId),
  };
};
