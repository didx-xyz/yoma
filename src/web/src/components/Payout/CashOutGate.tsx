import Link from "next/link";
import { IoIosInformationCircleOutline, IoMdWarning } from "react-icons/io";
import {
  GATE_CLOSE_ACTION,
  GATE_COPY,
  GATE_PROFILE_ACTION,
} from "~/lib/payout/copy";
import type { CashOutBlockReason } from "~/lib/payout/eligibility";
import { CashOutMessage, type CashOutMessageTone } from "./CashOutMessage";

/**
 * The blocking states of the Cash Out gate — everything a youth can be told instead of the amount
 * form. `cashOutEligibility` decides *which* reason applies, `GATE_COPY` says how it reads, and
 * this decides how it looks.
 *
 * Tone rules, from the epic:
 *
 * - **None of these is an error.** A withdrawn corridor, an unreachable provider and a wallet
 *   still being created are all things Yoma or the provider did, not things the youth did wrong.
 *   No red, no warning iconography for those, and no apology either.
 * - **The provider is never named**, and "Cash Out" is always the action wording.
 * - Nothing here says or implies that ZLTO has been lost.
 *
 * `providerOffline` and `balanceUnknown` deliberately follow the same wallet-offline pattern as the
 * ledger's own notice: calm, temporary, "your Zlto is safe".
 *
 * `activePayout` is reachable in principle but not in practice: the entry point sends a youth with
 * a payout in flight to `CashOutResumePanel` instead, which can show what is in flight and fetch a
 * fresh session. Its copy stays in `GATE_COPY` because that panel uses it as its notice.
 */

/**
 * `info` for the states nobody can act on — a corridor not yet open, a provider that cannot be
 * reached, a wallet still being made — and `warning` for the ones the youth can clear themselves.
 * Colour is the only difference: **no state here is an error**, so none of them is red.
 */
const TONE: Record<CashOutBlockReason, CashOutMessageTone> = {
  activePayout: "warning",
  profileIncomplete: "warning",
  providerOffline: "info",
  countryUnsupported: "info",
  walletNotReady: "info",
  balanceUnknown: "info",
  nothingAvailable: "info",
};

/** The same two icons as before, now in the round badge every other screen uses. */
const ICON: Record<CashOutBlockReason, React.ReactNode> = {
  activePayout: <IoMdWarning className="h-6 w-6" />,
  profileIncomplete: <IoMdWarning className="h-6 w-6" />,
  providerOffline: <IoIosInformationCircleOutline className="h-6 w-6" />,
  countryUnsupported: <IoIosInformationCircleOutline className="h-6 w-6" />,
  walletNotReady: <IoIosInformationCircleOutline className="h-6 w-6" />,
  balanceUnknown: <IoIosInformationCircleOutline className="h-6 w-6" />,
  nothingAvailable: <IoIosInformationCircleOutline className="h-6 w-6" />,
};

export const CashOutGate: React.FC<{
  reason: CashOutBlockReason;
  /** the server's own field wording, for `profileIncomplete` */
  missingFields?: string[];
  onClose: () => void;
}> = ({ reason, missingFields, onClose }) => {
  const content = GATE_COPY[reason];
  const tone = TONE[reason];

  return (
    <div className="flex grow flex-col gap-4 p-4">
      {/* NB: `gl-icon-yellow`, used for these icons elsewhere in the repo, has no CSS rule anywhere
          — the triangles it styles render in inherited grey. The badge sets colour explicitly. */}
      <CashOutMessage
        icon={ICON[reason]}
        tone={tone}
        title={content.title}
        body={content.body}
        className="grow justify-center"
      />

      {/* A plain disc list, deliberately: a tick beside "Email address" reads as *done*, which is
          the opposite of what this list means. Centred as a block, left-aligned inside it, so the
          fields stay scannable under a centred message. */}
      {reason === "profileIncomplete" && missingFields?.length ? (
        <ul className="text-gray-dark mx-auto w-fit list-disc pl-6 text-left text-sm">
          {missingFields.map((field) => (
            <li key={field} className="first-letter:uppercase">
              {field}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-col items-center gap-2 pt-2">
        {reason === "profileIncomplete" && (
          <Link
            href="/user/profile"
            className="btn bg-purple hover:bg-purple w-full rounded-full text-white normal-case hover:text-white"
          >
            {GATE_PROFILE_ACTION}
          </Link>
        )}

        {/* The gates whose fix is a link away get one, rather than a Close-only dead end: nothing
            available sends them to earn some, an unsupported country to check it is the right one
            (copy review 2026-09-14). */}
        {content.link && (
          <Link
            href={content.link.href}
            className="btn bg-purple hover:bg-purple w-full rounded-full text-white normal-case hover:text-white"
          >
            {content.link.label}
          </Link>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn border-gray text-gray-dark hover:bg-gray-light w-full rounded-full border bg-white normal-case"
        >
          {GATE_CLOSE_ACTION}
        </button>
      </div>
    </div>
  );
};
