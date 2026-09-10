import Image from "next/image";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import { IoPauseCircleOutline } from "react-icons/io5";
import FormError from "../Common/FormError";
import type { CashOutAmountProblem } from "~/lib/payout/amount";
import { conversionRateLine } from "~/lib/payout/conversion";
import {
  AMOUNT_COPY,
  AMOUNT_PROBLEM_COPY,
  amountAboveAvailableMessage,
} from "~/lib/payout/copy";
import { EMPTY_VALUE, formatUsd, formatZlto } from "~/lib/format/rewards";

/**
 * Step 1 — how much Zlto to cash out, with the indicative USD value beneath it.
 *
 * Presentational: the amount, its problem and the preview all arrive as props, and the entry point
 * owns the fetching. Two things about this step are contract decisions rather than styling:
 *
 * - **The ceiling is `available`, never `total`.** Zlto reserved for a payout has already left
 *   `available`, so checking against `total` would let the same Zlto be spent twice.
 * - **`treasuryFundsAvailable: false` is a panel, not a field error.** Yoma has run out of
 *   cash-out funds for the period; the amount the youth typed was never the problem, and marking
 *   the field red sends them to fix a number that is already correct.
 *
 * The USD figure is labelled an estimate wherever it appears, because the conversion is applied
 * again at initiation and the final amount may differ.
 */

export type CashOutPreview =
  /** no valid amount typed yet — the estimate reads as an em dash, and nothing is wrong */
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; usd: number; rate: number | null; paused: boolean }
  /** the preview call failed; the amount is still valid, so this is not a field error either */
  | { state: "failed" };

const FIELD_ID = "cash-out-amount";
const ERROR_ID = "cash-out-amount-error";

/** "empty" is a state, not a mistake — there is nothing to tell the youth about it. */
const problemMessage = (
  problem: CashOutAmountProblem,
  available: number,
): string | null => {
  switch (problem) {
    case "empty":
      return null;
    case "aboveAvailable":
      return amountAboveAvailableMessage(available);
    default:
      return AMOUNT_PROBLEM_COPY[problem];
  }
};

export const CashOutAmountStep: React.FC<{
  available: number;
  value: string;
  onChange: (value: string) => void;
  onMax: () => void;
  problem?: CashOutAmountProblem;
  /** held back until the field has been left or Continue pressed, so it does not scold mid-typing */
  showProblem: boolean;
  /** a server rejection of an amount this component considers valid — the profile was stale */
  serverError?: string;
  preview: CashOutPreview;
  canContinue: boolean;
  onContinue: () => void;
  onCancel: () => void;
}> = ({
  available,
  value,
  onChange,
  onMax,
  problem,
  showProblem,
  serverError,
  preview,
  canContinue,
  onContinue,
  onCancel,
}) => {
  const fieldError =
    serverError ??
    (showProblem && problem ? problemMessage(problem, available) : null);
  const paused = preview.state === "ready" && preview.paused;
  const rateLine =
    preview.state === "ready" ? conversionRateLine(preview.rate) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* The ceiling, stated before the field rather than only enforced by it. */}
      <p className="text-gray-dark flex flex-row items-center justify-center gap-2 text-sm">
        {AMOUNT_COPY.availableLabel}
        <span className="flex flex-row items-center gap-1 font-bold text-black">
          <Image src={iconZltoColor} alt="" width={16} className="h-auto" />
          <span className="tabular-nums">{formatZlto(available)}</span>
          <span className="sr-only">{AMOUNT_COPY.unit}</span>
        </span>
      </p>

      <div className="flex flex-col gap-1">
        {/* Label and Max as siblings: a button inside a <label> would also fire the label. */}
        <div className="flex flex-row items-baseline justify-between gap-4">
          <label htmlFor={FIELD_ID} className="text-sm font-semibold">
            {AMOUNT_COPY.fieldLabel}
          </label>
          <button
            type="button"
            onClick={onMax}
            className="text-purple text-sm font-bold underline-offset-2 hover:underline"
          >
            {AMOUNT_COPY.maxAction}
          </button>
        </div>

        <div
          className={`flex flex-row items-center gap-3 rounded-lg border bg-white px-4 py-3 ${
            fieldError ? "border-red-500" : "border-gray"
          }`}
        >
          <Image src={iconZltoColor} alt="" width={22} className="h-auto" />
          <input
            id={FIELD_ID}
            // `inputMode` rather than `type="number"`: the numeric keypad on mobile without the
            // spinner, the scroll-wheel edits, or `type="number"` quietly accepting "1e5" —
            // `parseAmountInput` is what decides whether the text is a number.
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? ERROR_ID : undefined}
            className="w-full grow bg-transparent text-2xl font-bold tabular-nums outline-none"
            placeholder="0"
          />
          <span className="text-gray-dark text-xs font-bold">
            {AMOUNT_COPY.unit}
          </span>
        </div>

        {fieldError && <FormError label={fieldError} id={ERROR_ID} />}
      </div>

      {/* ESTIMATE — the USD value, always labelled as an estimate, with the rate for context. */}
      <div className="bg-blue-light flex flex-row items-center justify-between gap-4 rounded-lg px-4 py-3">
        <div className="flex flex-col">
          <span className="text-gray-dark text-[11px] font-bold tracking-wide uppercase">
            {AMOUNT_COPY.estimateLabel}
          </span>
          {/* Dropped rather than em-dashed when the rate cannot be established from the rounded
              preview — a rate is context, and absent context is better unsaid than shown missing
              (see lib/payout/conversion.ts). */}
          {rateLine && (
            <span className="text-gray-dark text-[11px]">{rateLine}</span>
          )}
        </div>

        {preview.state === "loading" ? (
          // The skeleton sits on the USD figure only: the rest of the panel is not in flight.
          <span
            className="skeleton h-6 w-20 rounded"
            aria-label="Working out your estimate"
          />
        ) : (
          <span className="text-lg font-bold tabular-nums">
            {preview.state === "ready" ? formatUsd(preview.usd) : EMPTY_VALUE}
          </span>
        )}
      </div>

      {preview.state === "failed" && (
        <p className="text-gray-dark text-xs">{AMOUNT_COPY.estimateFailed}</p>
      )}

      {/* PAUSED — Yoma's own funds, not the youth's amount, and never styled as an error. */}
      {paused && (
        <div className="bg-orange-light flex flex-row items-start gap-3 rounded-lg px-4 py-3">
          <IoPauseCircleOutline className="text-orange mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold">{AMOUNT_COPY.pausedTitle}</span>
            <span className="text-sm leading-6">{AMOUNT_COPY.pausedBody}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          // daisyUI's disabled look — grey fill, grey text. Not a muted purple: that reads as
          // "working", which is what the hand-off step actually looks like.
          className={`w-full rounded-full normal-case ${
            canContinue
              ? "btn bg-purple hover:bg-purple text-white hover:text-white"
              : "btn btn-disabled"
          }`}
        >
          {AMOUNT_COPY.continueAction}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost text-gray-dark rounded-full normal-case"
        >
          {AMOUNT_COPY.cancelAction}
        </button>
      </div>
    </div>
  );
};
