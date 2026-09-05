import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type {
  UserPreferenceScope,
  UserPreferences,
} from "~/api/models/userPreferences";
import {
  getUserPreferences,
  saveUserPreferences,
} from "~/api/services/userPreferences";

/**
 * The youth's stored preferences, read through the façade (mocked locally until the presets API
 * lands). Anonymous visitors get session-held answers; signed-in youths their stored preset.
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

const seenStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.localStorage;

export function usePreferences(): {
  scope: UserPreferenceScope;
  /** `undefined` while loading; `null` = never captured. */
  preferences: UserPreferences | null | undefined;
  save: (preferences: UserPreferences) => Promise<UserPreferences>;
  readPersonalizationSeen: () => boolean;
  markPersonalizationSeen: () => void;
} {
  const { status } = useSession();
  const scope: UserPreferenceScope =
    status === "authenticated" ? "user" : "anonymous";
  const queryClient = useQueryClient();
  const queryKey = ["discovery", "preferences", scope];

  const { data } = useQuery({
    queryKey,
    queryFn: () => getUserPreferences(scope),
    enabled: status !== "loading",
    staleTime: Infinity, // the façade is the only writer, and it updates the cache below
  });

  const { mutateAsync: save } = useMutation({
    mutationFn: (preferences: UserPreferences) =>
      saveUserPreferences(scope, preferences),
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
  });

  return {
    scope,
    preferences: data,
    save,
    readPersonalizationSeen: () => seenStorage()?.getItem(SEEN_KEY) === "1",
    markPersonalizationSeen: () => seenStorage()?.setItem(SEEN_KEY, "1"),
  };
}
