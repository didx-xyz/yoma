import Image from "next/image";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import iconZltoCircle from "public/images/icon-zlto-rounded.webp";
import type { ReactNode } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import type { UserProfileZlto } from "~/api/models/user";
import { formatZlto } from "~/lib/format/rewards";

/**
 * The youth wallet ledger — the one component that renders the ZLTO figures, on both surfaces that
 * show them: the Marketplace hero (`compact`) and the Yo-ID wallet card (`expanded`).
 *
 * Why one component for two surfaces: the same figures mean money, and a youth who reads
 * "available" as one number in the hero and a different one in the wallet has been told two
 * contradictory things about what they can spend. The variants differ in chrome and scale only —
 * never in which rows are shown or how a figure is derived.
 *
 * Fixed order, which is also how it reconciles:
 *
 *     Balance  −  Pending cash out  =  Available  +  Pending rewards  =  Total
 *
 * ⚠️ It reconciles on screen **always**, because the server derives `balance` from `available`.
 * A ledger that adds up is therefore not evidence that `available` is fresh, and the UI must never
 * present it as a cross-check. See `UserProfileZlto` for the offline contract.
 *
 * "Cash Out" is the user-facing action wording everywhere in this flow; the API/domain term is
 * `payout` and no payout provider may be named in copy.
 */

export type ZltoLedgerVariant = "compact" | "expanded";

/**
 * A movement changes the balance, so it carries a sign; a position is a balance at a point in the
 * sequence, so it does not. Keeping the two kinds distinct is what makes the ledger read as
 * arithmetic rather than as five unrelated numbers — positions get the subtotal rule above them,
 * movements sit flush under the position they act on.
 */
type RowKind = "opening" | "movement" | "position";

type LedgerRow = {
  label: string;
  value: number | null;
  kind: RowKind;
  sign?: "debit" | "credit";
  /** the figure the ledger exists to answer: what can be spent right now */
  primary?: boolean;
};

/** U+2212, not a hyphen: it matches the digit width and reads as a sign, not as punctuation. */
const MINUS = "−";

/**
 * Only rows that carry information.
 *
 * `balance` and `total` are `available` plus or minus a movement, so when that movement is zero
 * they are *the same number as `available`* — and a wallet with nothing in flight was rendering
 * one figure three times under three different labels. A youth reading three identical numbers
 * has to work out that they are identical before learning anything, and the arithmetic the ledger
 * exists to show isn't happening. So each movement brings its own partner position with it:
 *
 *   nothing in flight        Available
 *   rewards pending          Available · +Pending rewards · Total
 *   cash out in flight       Balance · −Pending cash out · Available
 *   both                     all five
 *
 * `available` is always shown — it is the primary figure and the one a payout is checked against.
 * The order never changes; rows only ever drop out of it.
 *
 * Offline is unaffected: the movements are Yoma's own record and keep their values, so an offline
 * wallet mid-payout still shows the reservation, with em dashes where the positions would be.
 */
const buildRows = (zlto: UserProfileZlto): LedgerRow[] => {
  const rows: LedgerRow[] = [];

  if (zlto.pendingPayout !== 0) {
    rows.push({ label: "Balance", value: zlto.balance, kind: "opening" });
    rows.push({
      label: "Pending cash out",
      value: zlto.pendingPayout,
      kind: "movement",
      sign: "debit",
    });
  }

  rows.push({
    label: "Available",
    value: zlto.available,
    kind: "position",
    primary: true,
  });

  if (zlto.pendingRewards !== 0) {
    rows.push({
      label: "Pending rewards",
      value: zlto.pendingRewards,
      kind: "movement",
      sign: "credit",
    });
    rows.push({ label: "Total", value: zlto.total, kind: "position" });
  }

  return rows;
};

/**
 * Movements render signed, positions bare, and a figure the API does not have renders as the em
 * dash from `formatZlto` — never blank, and never a substituted `0`, which is a real balance a
 * youth would act on.
 */
const ledgerAmount = (row: LedgerRow): string => {
  const amount = formatZlto(row.value);
  if (!row.sign || row.value == null) return amount;
  return `${row.sign === "debit" ? MINUS : "+"}${amount}`;
};

/**
 * Compact sits on the sky-blue hero band, expanded on a white card. Compact keeps every figure at
 * full white rather than tinting the secondary rows — the hero band is already the lowest-contrast
 * surface in the product, so weight and size carry the hierarchy instead of opacity.
 */
const VARIANTS = {
  compact: {
    root: "text-white",
    rule: "border-white/60",
    row: "py-0.5",
    gap: "gap-4",
    label: "text-[12px] tracking-wide",
    value: "text-xs font-bold",
    primary: "text-lg leading-tight font-bold",
    notice: "text-[11px]",
    icon: iconZltoCircle,
    iconSize: 16,
  },
  expanded: {
    root: "text-black",
    rule: "border-[#FFD69C]",
    row: "py-0.5",
    gap: "gap-6",
    label: "text-xs",
    value: "text-xs font-semibold",
    primary: "text-base leading-tight font-bold",
    notice: "text-[12px] text-gray-dark",
    icon: iconZltoColor,
    iconSize: 16,
  },
} as const satisfies Record<ZltoLedgerVariant, unknown>;

export const ZltoLedger: React.FC<{
  zlto: UserProfileZlto;
  variant?: ZltoLedgerVariant;
  /**
   * Where the Cash Out entry point goes. The action belongs to the ledger rather than to either
   * host surface, so both get it in the same place and neither can drift.
   */
  actions?: ReactNode;
  className?: string;
}> = ({ zlto, variant = "compact", actions, className = "" }) => {
  const style = VARIANTS[variant];
  const rows = buildRows(zlto);

  return (
    <div className={`flex flex-col gap-2 ${style.root} ${className}`}>
      <dl className="flex flex-col">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex flex-row items-center justify-between ${style.gap} ${style.row} ${
              /*
                The accounting subtotal rule: a line above the position a movement produces, and
                nothing between a position and the movement acting on it. Suppressed on the first
                row, where there is no arithmetic above it to total.
              */
              row.kind === "position" && index > 0
                ? `border-t border-dotted ${style.rule}`
                : ""
            }`}
          >
            <dt className={style.label}>{row.label}</dt>
            <dd className="flex flex-row items-center gap-2">
              <Image
                src={style.icon}
                alt=""
                width={style.iconSize}
                className="h-auto"
              />
              {/* tabular-nums so the digits sit in fixed-width cells and the figures line up in a
                  column — proportional digits make a stack of numbers look bent. */}
              <span
                className={`tabular-nums ${row.primary ? style.primary : style.value}`}
              >
                {ledgerAmount(row)}
              </span>
              <span className="sr-only">ZLTO</span>
            </dd>
          </div>
        ))}
      </dl>

      {/*
        The notice explains the em dashes; it does not decide them. `zltoOffline` is the reason,
        the `null` figures are the state — see `UserProfileZlto`. Tone stays calm: nothing is lost
        and the youth did nothing wrong.
      */}
      {zlto.zltoOffline && (
        <p className={`flex flex-row items-start gap-1 ${style.notice}`}>
          <IoIosInformationCircleOutline className="h-4 w-4 shrink-0" />
          <span>Balance temporarily unavailable. Your Zlto is safe.</span>
        </p>
      )}

      {actions}
    </div>
  );
};
