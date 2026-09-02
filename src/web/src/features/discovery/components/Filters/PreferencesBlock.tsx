import React from "react";
import { IoPersonOutline } from "react-icons/io5";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Chip } from "../shared/Chip";

/**
 * Block 3 — the preference layer inside the filter surface: the master "Using my preferences"
 * switch plus the inherited chips. Switching one chip off leaves it on screen, struck through,
 * with an undo; the master switch drops or restores the whole inherited set. Nothing here writes
 * to the profile. The icon tile mirrors the results page's `PreferenceBanner`.
 */
export const PreferencesBlock: React.FC<{ onEdit: () => void }> = ({
  onEdit,
}) => {
  const { state, dispatch, chips, preferences } = useDiscovery();
  const inherited = chips.filter((chip) => chip.prefKey !== null);

  // Still loading — render nothing rather than flashing the empty state.
  if (preferences === undefined) return null;

  // No preferences captured yet — offer the way in (block 3 must not silently vanish).
  if (preferences === null)
    return (
      <section className="bg-purple-tint/40 flex items-center gap-2 rounded-lg p-2.5">
        <span className="bg-purple-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <IoPersonOutline className="text-purple h-4 w-4" />
        </span>
        <span className="text-gray-dark grow text-xs">
          No preferences set — personalize your feed once and every search uses
          it.
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-purple min-h-8 shrink-0 text-xs font-semibold whitespace-nowrap underline"
        >
          Set my preferences
        </button>
      </section>
    );

  return (
    <section className="bg-purple-tint/40 rounded-lg p-2.5">
      <div className="flex items-center gap-2">
        <span className="bg-purple-tint flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <IoPersonOutline className="text-purple h-4 w-4" />
        </span>
        <span className="text-purple grow text-xs font-semibold">
          Using my preferences
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-purple min-h-8 text-xs font-semibold underline"
        >
          Edit
        </button>
        <input
          type="checkbox"
          className="toggle toggle-sm checked:[--input-color:var(--color-purple)]"
          checked={!state.preferencesOff}
          onChange={(e) =>
            dispatch({ kind: "setPreferencesOff", off: !e.target.checked })
          }
          aria-label="Using my preferences"
        />
      </div>
      {!state.preferencesOff && inherited.length > 0 && (
        <>
          <ScrollableContainer className="mt-2 flex gap-1.5 overflow-x-auto">
            {inherited.map((chip) => (
              <Chip
                key={chip.id}
                chip={chip}
                onRemove={() =>
                  chip.prefKey &&
                  dispatch({
                    kind: "setPreferenceSkipped",
                    key: chip.prefKey,
                    skipped: true,
                  })
                }
                onUndo={() =>
                  chip.prefKey &&
                  dispatch({
                    kind: "setPreferenceSkipped",
                    key: chip.prefKey,
                    skipped: false,
                  })
                }
              />
            ))}
          </ScrollableContainer>
          <p className="text-purple-shade pt-2 text-[11px]">
            Removing one here does not change your profile. Tap the arrow to put
            it back.
          </p>
        </>
      )}
      {state.preferencesOff && (
        <p className="text-purple-shade pt-2 text-[11px]">
          Switched off for this search. Your profile has not changed.
        </p>
      )}
    </section>
  );
};
