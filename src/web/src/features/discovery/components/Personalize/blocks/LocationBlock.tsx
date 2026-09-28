import { useAtomValue } from "jotai";
import Link from "next/link";
import React from "react";
import { EMPTY_LOCATION_PLACE } from "~/api/models/location";
import type { UserPreferences } from "~/api/models/userPreferences";
import { EMPTY_USER_LOCATION } from "~/api/models/userPreferences";
import { LocationInput } from "~/components/Location/LocationInput";
import { COUNTRY_CODE_WW } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import { isStaleUserLocation } from "../../../lib/location";
import { useDiscovery } from "../../../state/DiscoveryContext";
import { Message } from "../../shared/Message";

/**
 * "Where you are" — the wizard's location block (step 5, above Languages; no extra step).
 *
 * Signed in, the country is the PROFILE's global country: shown read-only with a way to change it
 * on the profile page, never edited here — other features read it too. Anonymous, there is no
 * profile, so the youth picks a country here and it lives in the session with their answers.
 * Region and city are picked within that country through the shared `LocationInput`.
 *
 * A stored place picked under a country the profile no longer has is stale: it is not applied,
 * the fields start empty, and the block says why.
 */
const PROFILE_HREF = "/user/profile";

export const LocationBlock: React.FC<{
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ draft, onPatch }) => {
  const { scope, lookups } = useDiscovery();
  const profile = useAtomValue(userProfileAtom);
  const signedIn = scope === "user";

  const countryId = signedIn
    ? (profile?.countryId ?? null)
    : draft.location.countryId;
  const country =
    lookups.countries.find(
      (c) => c.id === countryId && c.codeAlpha2 !== COUNTRY_CODE_WW,
    ) ?? null;
  const stale = signedIn && isStaleUserLocation(draft.location, countryId);
  const place = stale ? EMPTY_LOCATION_PLACE : draft.location;
  // "Worldwide" is a lookup entry for opportunities, not somewhere a youth can be.
  const choosable = lookups.countries
    .filter((c) => c.codeAlpha2 !== COUNTRY_CODE_WW)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-3">
      {signedIn ? (
        <div className="border-gray flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border p-3 text-sm">
          <span className="w-28 shrink-0 font-semibold">Country</span>
          <span className="grow">{country?.name ?? "Not set"}</span>
          <Link
            href={PROFILE_HREF}
            className="text-green text-xs font-semibold underline"
          >
            {country ? "Change in your profile" : "Add it in your profile"}
          </Link>
        </div>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
            Country
          </span>
          <select
            value={countryId ?? ""}
            onChange={(e) =>
              // A new country orphans the region and city picked under the old one.
              onPatch({
                location: {
                  ...EMPTY_USER_LOCATION,
                  countryId: e.target.value === "" ? null : e.target.value,
                },
              })
            }
            className="select border-gray focus:border-gray h-11 w-full focus:outline-none md:h-10"
          >
            <option value="">Choose your country</option>
            {choosable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {stale && (
        <Message kind="warning">
          Your profile country changed — pick your region or city again.
        </Message>
      )}

      <LocationInput
        countryCode={country?.codeAlpha2 ?? null}
        value={place}
        onChange={(next) => onPatch({ location: { ...next, countryId } })}
        disabledNote={
          signedIn
            ? "Add your country to your profile to set a region or city."
            : "Choose your country first."
        }
        renderCountryMismatch={({ countryCode, countryName, place: found }) => {
          if (signedIn)
            return (
              <Link href={PROFILE_HREF} className="font-semibold underline">
                Change your profile country
              </Link>
            );
          const detected = lookups.countries.find(
            (c) => c.codeAlpha2.toUpperCase() === countryCode,
          );
          return detected ? (
            <button
              type="button"
              onClick={() =>
                onPatch({ location: { ...found, countryId: detected.id } })
              }
              className="font-semibold underline"
            >
              Switch to {countryName}
            </button>
          ) : null;
        }}
      />
    </div>
  );
};
