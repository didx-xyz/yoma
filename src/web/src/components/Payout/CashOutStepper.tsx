import { IoMdCheckmark } from "react-icons/io";
import { STEP_LABELS } from "~/lib/payout/copy";

/**
 * Amount · Review · Result.
 *
 * ⚠️ **Step 3 is "Result", and it resolves only on the result view** — never during the hand-off.
 * The board originally called it "Finish", which is a promise Yoma cannot keep: step 2 → 3 crosses
 * out to the hosted journey, and creating a hosted session is not a completed payout. So the
 * hand-off leaves step 3 pending and the youth reaches a resolved step 3 only once Yoma has
 * something to tell them (design review 2026-09-09, applied 2026-09-10).
 *
 * Not daisyUI's `steps`: it puts the label under the bullet, and the design has the number and its
 * label side by side with the connector between pairs. Small enough to draw.
 */

export type CashOutStep = 1 | 2 | 3;

export const CashOutStepper: React.FC<{
  current: CashOutStep;
  /** step 3 only: the result view has something to show, so the last step reads as done */
  resolved?: boolean;
}> = ({ current, resolved = false }) => (
  <ol className="flex flex-row items-center justify-center gap-2">
    {STEP_LABELS.map((label, index) => {
      const step = index + 1;
      const isDone = step < current || (step === current && resolved);
      const isCurrent = step === current && !resolved;

      return (
        <li key={label} className="flex flex-row items-center gap-2">
          {/* The connector belongs to the step it leads into, so the first step has none. */}
          {index > 0 && (
            <span
              className={`h-px w-6 md:w-10 ${
                step <= current ? "bg-purple" : "bg-gray"
              }`}
              aria-hidden="true"
            />
          )}

          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isDone || isCurrent
                ? "bg-purple text-white"
                : "bg-gray text-gray-dark"
            }`}
            aria-hidden="true"
          >
            {isDone ? <IoMdCheckmark className="h-4 w-4" /> : step}
          </span>

          <span
            // The one step a screen reader should land on is the one the youth is on.
            aria-current={isCurrent ? "step" : undefined}
            className={`text-xs ${
              isDone || isCurrent
                ? "font-semibold text-black"
                : "text-gray-dark"
            }`}
          >
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);
