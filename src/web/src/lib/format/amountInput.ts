/**
 * Parsing for the amount inputs on every reward form (Treasury pools, organisation pools, referral
 * pools). The counterpart to `lib/format/rewards.ts`: that module turns numbers into text, this one
 * turns typed text into a number plus the facts the validators need.
 *
 * Amount fields are kept as strings in form state deliberately — decimal-place rules have to inspect
 * what the admin actually typed. Counting decimals off a parsed float is unreliable, and the API's
 * "no more than N decimal places" rules are exact.
 */

export type ParsedAmount =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "value"; value: number; decimals: number };

/**
 * Rejects anything that is not a plain decimal number — including the scientific notation a
 * `type="number"` field will happily accept ("1e5") — so a value can never be silently
 * reinterpreted.
 *
 * A leading minus parses rather than failing: the "must be more than 0" rules then produce a better
 * message than "that isn't a number", and they are what the server says too.
 */
export const parseAmountInput = (raw: string | number): ParsedAmount => {
  const text = typeof raw === "number" ? raw.toString() : (raw ?? "").trim();
  if (!text) return { kind: "empty" };
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return { kind: "invalid" };

  const value = Number(text);
  if (!Number.isFinite(value)) return { kind: "invalid" };

  // Trailing zeros are not decimal places the server would object to ($1.50 is two, not three).
  const fraction = text.split(".")[1] ?? "";
  let decimals = fraction.length;
  while (decimals > 0 && fraction[decimals - 1] === "0") decimals--;

  return { kind: "value", value, decimals };
};

/** The amount as the API wants it: a number, or null for "no allocation". */
export const amountOrNull = (raw: string): number | null => {
  const parsed = parseAmountInput(raw);
  return parsed.kind === "value" ? parsed.value : null;
};
