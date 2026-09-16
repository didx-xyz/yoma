import { useCallback, useEffect, useState } from "react";
import type {
  UserPreferenceScope,
  UserPreferences,
} from "~/api/models/userPreferences";
import {
  EMPTY_USER_PREFERENCES,
  mergeUserPreferences,
} from "~/api/models/userPreferences";
import {
  clearUserPreferences,
  getUserPreferences,
} from "~/api/services/userPreferences";

/**
 * The anonymous → signed-in hand-over (YOM-1261). Anonymous answers live in `sessionStorage` and
 * die with the session; when a youth signs in while such answers exist, we offer ONCE to keep
 * them. Keeping merges them into the stored preset through the façade — an existing preset is
 * never overwritten silently (multi-selects union; the session's answers win where both set a
 * single value). Declining discards the session answers, which also retires the offer.
 */
const hasAnswers = (preferences: UserPreferences | null): boolean =>
  preferences !== null &&
  JSON.stringify(preferences) !== JSON.stringify(EMPTY_USER_PREFERENCES);

export function useAnonymousMigration(
  scope: UserPreferenceScope,
  /** The signed-in youth's stored preset — `undefined` while loading. */
  stored: UserPreferences | null | undefined,
  saveStored: (preferences: UserPreferences) => Promise<UserPreferences>,
): {
  /**
   * Session-held answers awaiting the youth's keep/discard decision. `undefined` = still
   * checking the store (the personalization auto-open must wait for this to resolve, or it
   * races the offer); `null` = resolved, no offer.
   */
  pendingAnonymous: UserPreferences | null | undefined;
  keepAnswers: () => Promise<void>;
  discardAnswers: () => Promise<void>;
} {
  const [pendingAnonymous, setPendingAnonymous] = useState<
    UserPreferences | null | undefined
  >(undefined);

  // The offer exists only while signed in with session answers present. Reading through the
  // façade keeps this module off the live/mock modules (the façade rule).
  useEffect(() => {
    if (scope !== "user") {
      setPendingAnonymous(null);
      return;
    }
    let cancelled = false;
    void getUserPreferences("anonymous").then((anonymous) => {
      if (!cancelled)
        setPendingAnonymous(hasAnswers(anonymous) ? anonymous : null);
    });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const retire = useCallback(async (): Promise<void> => {
    await clearUserPreferences("anonymous");
    setPendingAnonymous(null);
  }, []);

  const keepAnswers = useCallback(async (): Promise<void> => {
    // `stored === undefined` means the preset query has not resolved — merging into EMPTY then
    // would clobber an existing preset. The prompt only renders once it has resolved.
    if (!pendingAnonymous || stored === undefined) return;
    await saveStored(
      mergeUserPreferences(stored ?? EMPTY_USER_PREFERENCES, pendingAnonymous),
    );
    await retire();
  }, [pendingAnonymous, stored, saveStored, retire]);

  return {
    pendingAnonymous,
    keepAnswers,
    discardAnswers: retire,
  };
}
