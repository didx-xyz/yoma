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
 */
const SEEN_KEY = "yoma.discovery.personalizationSeen";

const seenStorage = (scope: UserPreferenceScope): Storage | null => {
  if (typeof window === "undefined") return null;
  return scope === "user" ? window.localStorage : window.sessionStorage;
};

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
    readPersonalizationSeen: () =>
      seenStorage(scope)?.getItem(SEEN_KEY) === "1",
    markPersonalizationSeen: () => seenStorage(scope)?.setItem(SEEN_KEY, "1"),
  };
}
