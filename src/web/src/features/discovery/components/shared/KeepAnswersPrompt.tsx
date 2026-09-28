import { useAtomValue } from "jotai";
import React, { useState } from "react";
import { IoSparklesOutline } from "react-icons/io5";
import { hasPlace } from "~/api/models/location";
import { anonymousLocationCarriesOver } from "~/api/models/userPreferences";
import { userProfileAtom } from "~/lib/store";
import { placeLabel } from "../../lib/location";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * The sign-in "keep your answers" offer (YOM-1261): a youth who answered the wizard anonymously
 * and then signed in is asked ONCE whether to keep those session answers. Keeping merges them
 * into the stored preset (never a silent overwrite); discarding lets them go with the session.
 * Renders nothing until both the offer and the stored preset have resolved — keeping must merge
 * against the real preset, not a loading placeholder.
 *
 * The profile country wins over the session's: a place answered anonymously in another country
 * is not kept, and the offer says so before the youth decides.
 */
export const KeepAnswersPrompt: React.FC = () => {
  const { preferences, migration, markPersonalizationSeen } = useDiscovery();
  const [busy, setBusy] = useState(false);
  const profile = useAtomValue(userProfileAtom);

  if (!migration.pendingAnonymous || preferences === undefined) return null;

  const pending = migration.pendingAnonymous;
  const droppedPlace =
    hasPlace(pending.location) &&
    !anonymousLocationCarriesOver(pending, profile?.countryId ?? null)
      ? placeLabel(pending.location)
      : null;

  const act = (action: () => Promise<void>) => (): void => {
    setBusy(true);
    // Either choice IS the personalization decision — the wizard must not spring open the
    // moment the offer is answered (mark before the pending state clears, or the auto-open
    // effect wins the race).
    markPersonalizationSeen();
    void action().finally(() => setBusy(false));
  };

  return (
    <div className="bg-purple-tint/40 flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-xl p-2.5">
      <span className="bg-purple-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        <IoSparklesOutline className="text-purple h-4 w-4" />
      </span>
      <p className="min-w-40 grow basis-56 text-xs">
        <span className="font-semibold">
          Keep the answers you gave before signing in?
        </span>{" "}
        <span className="text-gray-dark">
          {preferences === null
            ? "They become your saved preferences and shape every search."
            : "They will be added to your saved preferences — nothing you saved is removed."}
          {droppedPlace &&
            ` ${droppedPlace} isn't in your profile country, so it won't be kept.`}
        </span>
      </p>
      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={act(migration.discardAnswers)}
          className="text-gray-dark min-h-8 text-xs disabled:opacity-40"
        >
          Discard
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={act(migration.keepAnswers)}
          className="btn btn-xs bg-green h-7 rounded-full border-none text-[11px] text-white disabled:opacity-40"
        >
          Keep my answers
        </button>
      </span>
    </div>
  );
};
