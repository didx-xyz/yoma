import { useAtomValue } from "jotai";
import React, { useEffect, useRef, useState } from "react";
import { IoArrowBack, IoArrowForward, IoClose } from "react-icons/io5";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import type { UserPreferences } from "~/api/models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "~/api/models/userPreferences";
import { userProfileAtom } from "~/lib/store";
import {
  applyInheritedFragments,
  mapPreferencesToFilters,
} from "../../lib/preferenceMapping";
import { EMPTY_DISCOVERY_FILTERS } from "../../lib/types";
import { PREFERENCE_STEPS } from "../../registry/preferenceSteps";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useResultCount } from "../../state/useResultCount";
import { Message } from "../shared/Message";
import { LiveCountPanel } from "./LiveCountPanel";
import { StepBlock } from "./StepBlock";

/**
 * The personalization wizard (YOM-1261) — six registry-driven steps beside the live-count panel.
 * Every step is optional and skippable; answers save to the preset (via the façade) only on
 * finish, and nothing here writes to the profile or the YoID.
 */
/**
 * NB: mount this only while open (`{open && <PersonalizeDialog …>}`). The draft is seeded from
 * the stored preferences in the `useState` initializer, which runs at MOUNT — a permanently
 * mounted dialog would seed it while the preferences query is still loading and edit an empty
 * form forever. Mount-on-open also resets the wizard to step 1 each time.
 */
export const PersonalizeDialog: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { preferences, savePreferences, markPersonalizationSeen, lookups } =
    useDiscovery();
  const profile = useAtomValue(userProfileAtom);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserPreferences>(
    () => preferences ?? EMPTY_USER_PREFERENCES,
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Moving between steps starts the new step at the top, not wherever the last one was scrolled.
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const previewFilters = applyInheritedFragments(
    EMPTY_DISCOVERY_FILTERS,
    mapPreferencesToFilters(draft, { countryId: profile?.countryId ?? null }),
    false,
    [],
  );
  const { count, counting } = useResultCount(
    previewFilters,
    lookups.typeIdByName,
    lookups.types.length > 0,
  );

  const current = PREFERENCE_STEPS[step]!;
  const last = step === PREFERENCE_STEPS.length - 1;

  const finish = async (): Promise<void> => {
    await savePreferences(draft);
    markPersonalizationSeen();
    onClose();
  };
  const advance = (): void => {
    if (last) void finish();
    else setStep(step + 1);
  };

  return (
    // Native <dialog> with `open` — the UA sizing/border/background resets keep our styling.
    <dialog
      open
      className="bg-overlay fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 p-0 md:p-4"
      aria-label="Personalize your feed"
    >
      {/* Only the step content scrolls; the purple panel, the progress row and the action
          footer stay put on both breakpoints. */}
      {/* Fixed height on md+ for the same reason the panel is fixed-width: the dialog must not
          resize as the youth moves between steps of different lengths. */}
      <div className="flex h-full w-full flex-col overflow-hidden bg-white md:h-[85vh] md:max-w-4xl md:flex-row md:rounded-2xl">
        <LiveCountPanel count={count} counting={counting} />
        <div className="flex min-h-0 grow flex-col p-4 md:p-8">
          <div className="flex items-center gap-1">
            {PREFERENCE_STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`h-1 grow rounded ${i <= step ? "bg-green" : "bg-gray"}`}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                markPersonalizationSeen();
                onClose();
              }}
              aria-label="Close personalization"
              className="hover:bg-gray-light ml-2 flex h-11 w-11 items-center justify-center rounded-full"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>
          <div ref={contentRef} className="min-h-0 grow overflow-y-auto">
            <p className="text-green pt-2 text-xs font-bold tracking-widest uppercase">
              Step {step + 1} of {PREFERENCE_STEPS.length}
            </p>
            <h1 className="pt-1 text-lg font-bold tracking-normal md:text-xl">
              {current.title}
            </h1>
            <p className="text-gray-dark pt-1 pb-4 text-sm">
              {current.subheading}
            </p>
            <div className="flex flex-col gap-5">
              {current.blocks.map((block, i) => (
                <StepBlock
                  key={`${current.id}:${i}`}
                  block={block}
                  draft={draft}
                  onPatch={(patch) => setDraft((d) => ({ ...d, ...patch }))}
                />
              ))}
              {current.infoNote && <Message>{current.infoNote}</Message>}
            </div>
          </div>
          {/* One scrollable action row — button text never wraps at 390px. containerClassName=""
              drops the wrapper's default h-full, which would stretch this row to fill the
              fixed-height wizard column. */}
          <ScrollableContainer
            containerClassName=""
            className="flex shrink-0 items-center gap-3 overflow-x-auto pt-4 md:pt-6"
          >
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="btn border-gray min-h-11 shrink-0 rounded-full bg-white whitespace-nowrap disabled:opacity-40"
            >
              <IoArrowBack className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={advance}
              className="text-gray-dark ml-auto min-h-11 shrink-0 cursor-pointer text-sm font-semibold whitespace-nowrap"
            >
              Skip this
            </button>
            <button
              type="button"
              onClick={advance}
              className="btn bg-green hover:bg-green-dark min-h-11 shrink-0 rounded-full border-none px-6 whitespace-nowrap text-white"
            >
              {last ? "Finish" : "Continue"}{" "}
              <IoArrowForward className="h-4 w-4" />
            </button>
          </ScrollableContainer>
        </div>
      </div>
    </dialog>
  );
};
