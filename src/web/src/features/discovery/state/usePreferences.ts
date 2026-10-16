import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import type {
  UserPreferenceScope,
  UserPreferences,
} from "~/api/models/userPreferences";
import {
  getUserPreferences,
  saveUserPreferences,
} from "~/api/services/userPreferences";
import { userProfileAtom } from "~/lib/store";
import { hasSettled } from "../lib/apiStatus";

/**
 * The youth's stored preferences. Anonymous visitors get session-held answers; signed-in youths
 * their saved preferences (`/user/preferences`, plus the place from their profile).
 *
 * The "seen personalization" marker is separate from the preferences themselves — skipping the
 * dialog still counts as seen, so it never auto-opens twice.
 *
 * It lives in `localStorage` for BOTH scopes (2026-09-05): on `sessionStorage` an anonymous
 * visitor met the auto-opening wizard again in every new tab, which is the opposite of "once".
 * Per device, like `yoma.discovery.viewMode` — and one marker across scopes, so signing in after
 * dismissing it does not spring the wizard open a second time.
 */
const SEEN_KEY = "yoma.discovery.personalizationSeen";

/** The preferences saved, but the place (a profile field) didn't: the save rejects with this. */
export class PlaceNotSavedError extends Error {
  /** What was saved — the preset the search now inherits from. */
  readonly preferences: UserPreferences;

  constructor(message: string, preferences: UserPreferences) {
    super(message);
    this.preferences = preferences;
  }
}

const seenStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.localStorage;

export function usePreferences(): {
  scope: UserPreferenceScope;
  /** `undefined` while loading (or after the read failed); `null` = never captured. */
  preferences: UserPreferences | null | undefined;
  /**
   * The read has answered or failed once — the search waits for it, so its first request is not
   * replaced by the personalized one a moment later. A failed read degrades to no preferences.
   */
  settled: boolean;
  /** Rejects with a readable message when the save — or the place, on the profile — fails. */
  save: (preferences: UserPreferences) => Promise<UserPreferences>;
  readPersonalizationSeen: () => boolean;
  markPersonalizationSeen: () => void;
} {
  const { status } = useSession();
  const scope: UserPreferenceScope =
    status === "authenticated" ? "user" : "anonymous";
  const queryClient = useQueryClient();
  const setUserProfile = useSetAtom(userProfileAtom);
  const queryKey = ["discovery", "preferences", scope];

  const query = useQuery({
    queryKey,
    queryFn: () => getUserPreferences(scope),
    enabled: status !== "loading",
    staleTime: Infinity, // this hook is the only writer, and it updates the cache below
  });
  const { data } = query;

  const { mutateAsync: save } = useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const saved = await saveUserPreferences(scope, preferences);
      // Whatever was saved is the truth now — even when the place then failed to save.
      queryClient.setQueryData(queryKey, saved.preferences);
      // The place is a profile field: keep the cached session profile in step with it.
      if (saved.profile) setUserProfile(saved.profile);
      if (saved.locationError)
        throw new PlaceNotSavedError(saved.locationError, saved.preferences);
      return saved.preferences;
    },
  });

  return {
    scope,
    preferences: data,
    settled: status !== "loading" && hasSettled(query),
    save,
    readPersonalizationSeen: () => seenStorage()?.getItem(SEEN_KEY) === "1",
    markPersonalizationSeen: () => seenStorage()?.setItem(SEEN_KEY, "1"),
  };
}
