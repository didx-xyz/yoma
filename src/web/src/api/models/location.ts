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

/**
 * The API's wire forms (user profile and opportunity countries, API 2026-09-28). Coordinates are
 * `[longitude, latitude]` — GeoJSON order, the reverse of how they are usually spoken — and the
 * source is a provider-neutral enum name. `placeId` has no API counterpart: it is used only while
 * resolving a new pick and is `null` on anything read back.
 */
export type ApiLocationSource = "Lookup" | "Device" | "Manual";

const TO_API_SOURCE: Record<LocationSource, ApiLocationSource> = {
  places: "Lookup",
  device: "Device",
  manual: "Manual",
};

const FROM_API_SOURCE: Record<ApiLocationSource, LocationSource> = {
  Lookup: "places",
  Device: "device",
  Manual: "manual",
};

export const toApiCoordinates = (
  coordinates: LocationCoordinates | null,
): number[] | null =>
  coordinates ? [coordinates.longitude, coordinates.latitude] : null;

export const fromApiCoordinates = (
  raw: number[] | null | undefined,
): LocationCoordinates | null =>
  Array.isArray(raw) &&
  raw.length === 2 &&
  raw.every((n) => typeof n === "number" && Number.isFinite(n))
    ? { longitude: raw[0]!, latitude: raw[1]! }
    : null;

export const toApiLocationSource = (
  source: LocationSource | null,
): ApiLocationSource | null => (source ? TO_API_SOURCE[source] : null);

export const fromApiLocationSource = (
  raw: string | null | undefined,
): LocationSource | null =>
  raw && raw in FROM_API_SOURCE
    ? FROM_API_SOURCE[raw as ApiLocationSource]
    : null;

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
