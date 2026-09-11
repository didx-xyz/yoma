import { parseAmountInput } from "~/lib/format/amountInput";

/**
 * The cash-out amount, checked exactly the way `PayoutService.PayoutRewards` checks it and in the
 * same order, so the client never sends a request the server will refuse.
 *
 * Verified 2026-09-09 against the branch: the amount is a **query parameter**
 * (`POST /user/payout/zlto?amount=`), there is **no request validator class**, and the service
 * throws directly:
 *
 *   1. `ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(amount, default)`  → amount > 0
 *   2. `decimal.Truncate(amount) != amount` → `ArgumentException`             → whole numbers only
 *   3. …the five eligibility checks (see `eligibility.ts`)…
 *   4. `walletBalance.Available < amount` → `ValidationException`             → the field error
 *
 * ⚠️ Only the last of those is a 400. `ExceptionResponseMiddleware` maps `ArgumentException` and
 * `ArgumentOutOfRangeException` nowhere, so they arrive as **HTTP 500** with an internal message —
 * which is why 1 and 2 are guarded here rather than left to the server to report.
 *
 * `available` is the ceiling because Zlto already reserved for a payout has left it (the API
 * derives `available` after reservations), so spending against `total` would spend the same Zlto
 * twice.
 */

export type CashOutAmountProblem =
  /** nothing typed — the preview shows an em dash and Continue is disabled, but nothing is wrong */
  | "empty"
  /** not a plain decimal number; `parseAmountInput` also rejects the `1e5` a number input allows */
  | "invalid"
  | "notPositive"
  | "notWhole"
  | "aboveAvailable";

export type CashOutAmount =
  | { ok: true; value: number }
  | { ok: false; problem: CashOutAmountProblem };

export const parseCashOutAmount = (
  raw: string,
  available: number,
): CashOutAmount => {
  const parsed = parseAmountInput(raw);
  if (parsed.kind === "empty") return { ok: false, problem: "empty" };
  if (parsed.kind === "invalid") return { ok: false, problem: "invalid" };

  if (parsed.value <= 0) return { ok: false, problem: "notPositive" };
  // Counted off the typed string, not off the parsed number: "600.5" and "600.50" are both
  // fractional, and "600.0" is not.
  if (parsed.decimals > 0) return { ok: false, problem: "notWhole" };
  if (parsed.value > available) return { ok: false, problem: "aboveAvailable" };

  return { ok: true, value: parsed.value };
};
