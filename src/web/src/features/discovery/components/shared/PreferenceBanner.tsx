import React, { useState } from "react";
import { IoPencilOutline, IoPersonOutline } from "react-icons/io5";
import { inheritedSummary, tunedToParts } from "../../lib/chipModel";
import {
  applySkipsToPreferences,
  savableSkips as savableSkipsOf,
  skipsAfterSave,
} from "../../lib/preferenceMapping";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useChipPulse } from "../../state/useChipPulse";
import { AppliedChips } from "../Results/AppliedChips";

/**
 * The preference strip above the results — and the ONE home for preference state on this page.
 * What the feed is tuned to, the master switch, the edit entry point, and (as a second line
 * inside the same panel, not a third stacked panel) the write-back offer whenever inherited
 * preferences are overridden. Never on load, never automatic.
 *
 * "Make this my default" persists the overrides one-tap through the façade: a skipped preference
 * is cleared from the preset. It is deliberately NOT called "save to profile" — a preset is
 * neither the profile nor the YoID. (The strip no longer promises "never touches your profile":
 * signed in, a place picked in the wizard IS written to the profile — see `LiveCountPanel`.)
 * Saving leaves an inline undo, because a one-tap write with no way back is not one-tap.
 * Since 2026-10-01 the preference CHIPS live here too (inherited, switched-off, inapplicable) —
 * every purple thing in one panel; this search's own filters have the green panel below.
 * Identity-derived skips (country, age) have no preset field, so they stay per-search and raise
 * no offer. "Not now" dismisses the CURRENT override set only — the next change to the skips
 * brings the offer back (the dismissal is keyed to a signature of the skipped keys).
 */
const DISMISSED_KEY = "yoma.discovery.writeBackDismissed";

/** Inherited values named in the banner before it collapses to "+N". */
const TUNED_TO_SHOWN = 2;

export const PreferenceBanner: React.FC<{ onEdit: () => void }> = ({
  onEdit,
}) => {
  const {
    state,
    dispatch,
    chips,
    preferences,
    savePreferences,
    verifiedSkillIds,
    // Held on the context, not here: saving the last override can flip the surface from results
    // to landing, which remounts this banner (see `PreferenceSnapshot`).
    preferenceUndo: undoTo,
    setPreferenceUndo: setUndoTo,
  } = useDiscovery();
  const pulse = useChipPulse();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(
    () =>
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(DISMISSED_KEY)
        : null,
  );

  // Still loading — render nothing rather than flashing the empty state.
  if (preferences === undefined) return null;

  // No preferences captured yet (e.g. the dialog was X-closed on first visit). This invite is
  // the re-entry point — without it, a youth who dismissed the wizard has no way back in.
  if (preferences === null)
    return (
      <div className="bg-purple-tint/40 flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-xl p-2.5">
        <span className="bg-purple-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <IoPersonOutline className="text-purple h-4 w-4" />
        </span>
        <p className="min-w-40 grow basis-56 text-xs">
          <span className="font-semibold">Tune your feed.</span>{" "}
          <span className="text-gray-dark">
            Tell us what you&apos;re looking for — set once, used on every
            search. Your YoID is never touched.
          </span>
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-xs bg-purple hover:bg-purple-shade h-7 rounded-full border-none text-[11px] font-semibold text-white"
        >
          Personalize my feed
        </button>
      </div>
    );

  const savableSkips = savableSkipsOf(state.preferencesSkipped, preferences);
  const skipSignature = [...savableSkips].sort().join(",");
  const notNow = (): void => {
    window.sessionStorage.setItem(DISMISSED_KEY, skipSignature);
    setDismissedSignature(skipSignature);
  };

  // Every inherited value, not just the first: "tuned to Job" hid the four other things the
  // feed was doing. Two by name, the rest as a count — a private value (the accessibility needs)
  // only ever in the count.
  const tunedTo = tunedToParts(inheritedSummary(chips), TUNED_TO_SHOWN).join(
    " · ",
  );
  // Saving a skills skip clears only the self-attested skills: the earned (verified) ones still
  // apply on the next visit (Jason, 2026-10-03), so the offer says so.
  const earnedSkillsStay =
    savableSkips.includes("skills") && verifiedSkillIds.length > 0;

  const saveOverrides = (): void => {
    setSaving(true);
    setSaveFailed(false);
    const previous = {
      preferences,
      skipped: state.preferencesSkipped,
    };
    void savePreferences(
      applySkipsToPreferences(preferences, state.preferencesSkipped),
      // The persisted skips no longer exist as preferences; only the identity-derived
      // (unsavable) ones stay switched off for this search — and skills, while verified skills
      // would bring the chip straight back (`skipsAfterSave`). Dispatched with the save.
      {
        kind: "setSkippedPreferences",
        keys: skipsAfterSave(state.preferencesSkipped, verifiedSkillIds),
      },
    )
      .then(() => setUndoTo(previous))
      .catch(() => setSaveFailed(true))
      .finally(() => setSaving(false));
  };

  const undoSave = (): void => {
    if (!undoTo) return;
    setSaving(true);
    setSaveFailed(false);
    void savePreferences(undoTo.preferences, {
      kind: "setSkippedPreferences",
      keys: undoTo.skipped,
    })
      .then(() => setUndoTo(null))
      .catch(() => setSaveFailed(true))
      .finally(() => setSaving(false));
  };

  return (
    <div className="bg-purple-tint/40 flex flex-col gap-2 rounded-xl p-2.5">
      {/* Wraps below sm: text row first, actions beneath — nothing overflows at 390px. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span className="bg-purple-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <IoPersonOutline className="text-purple h-4 w-4" />
        </span>
        <p className="min-w-40 grow basis-56 text-xs">
          {state.preferencesOff ? (
            <span className="font-semibold">
              Preferences switched off for this search. Your profile has not
              changed.
            </span>
          ) : (
            <>
              <span className="font-semibold">Your feed is tuned to </span>
              <span className="text-purple font-semibold">
                {tunedTo || "your preferences"}
              </span>
              <span className="text-gray-dark block text-[11px]">
                Set once, used on every search. Your YoID is never touched.
              </span>
            </>
          )}
        </p>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-xs bg-purple hover:bg-purple-shade h-7 rounded-full border-none text-[11px] font-semibold text-white"
          >
            <IoPencilOutline className="h-3 w-3" />
            Edit my preferences
          </button>
          {/* daisyUI 5 toggles colour via --input-color (what toggle-primary sets) — white
              track, coloured thumb when checked */}
          <input
            type="checkbox"
            className="toggle toggle-sm checked:[--input-color:var(--color-purple)]"
            checked={!state.preferencesOff}
            onChange={(e) =>
              dispatch({ kind: "setPreferencesOff", off: !e.target.checked })
            }
            aria-label="Using my preferences"
          />
        </span>
      </div>
      <AppliedChips kind="inherited" pulseChipId={pulse} />
      {/* Second LINE of this panel, not a panel of its own — preference state has one home. */}
      {savableSkips.length > 0 && skipSignature !== dismissedSignature && (
        <div className="border-purple-tint flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t pt-2 text-xs">
          <span className="min-w-40 grow basis-56">
            {savableSkips.length === 1
              ? "1 preference is off for this search."
              : `${savableSkips.length} preferences are off for this search.`}{" "}
            Keep {savableSkips.length === 1 ? "it" : "them"} off from now on?
            {earnedSkillsStay && " Skills you've earned still apply."}
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={notNow}
              className="text-gray-dark min-h-8 text-xs"
            >
              Not now
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveOverrides}
              className="btn btn-xs bg-green h-7 rounded-full border-none text-[11px] text-white disabled:opacity-40"
            >
              Make this my default
            </button>
          </span>
        </div>
      )}
      {saveFailed && (
        <p className="border-purple-tint text-pink border-t pt-2 text-xs font-semibold">
          Couldn&apos;t save that change. Please try again.
        </p>
      )}
      {undoTo && (
        <p className="border-purple-tint flex items-center gap-2 border-t pt-2 text-xs">
          <span className="font-semibold">Saved.</span>
          <button
            type="button"
            disabled={saving}
            onClick={undoSave}
            className="text-purple font-semibold underline disabled:opacity-40"
          >
            Undo
          </button>
        </p>
      )}
    </div>
  );
};
