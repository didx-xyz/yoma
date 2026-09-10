import Link from "next/link";
import { IoIosInformationCircleOutline, IoMdWarning } from "react-icons/io";
import { GATE_COPY } from "~/lib/payout/copy";
import type { CashOutBlockReason } from "~/lib/payout/eligibility";

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

/** `info` for temporary / not-the-youth's-fault states, `action` when the youth can fix it. */
const TONE: Record<CashOutBlockReason, "info" | "action"> = {
  activePayout: "action",
  profileIncomplete: "action",
  providerOffline: "info",
  countryUnsupported: "info",
  walletNotReady: "info",
  balanceUnknown: "info",
  nothingAvailable: "info",
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
    <div className="flex flex-col gap-4 p-4 text-gray-500">
      <div className="flex flex-row items-start gap-2">
        {/* NB: `gl-icon-yellow`, used for this icon elsewhere in the repo, has no CSS rule
            anywhere — the triangles it styles render in inherited grey. Colour is set here. */}
        {tone === "info" ? (
          <IoIosInformationCircleOutline className="text-blue h-6 w-6 shrink-0" />
        ) : (
          <IoMdWarning className="text-orange h-6 w-6 shrink-0" />
        )}
        <h5 className="text-black">{content.title}</h5>
      </div>

      <p className="text-sm leading-6">{content.body}</p>

      {/* A plain disc list, deliberately: a tick beside "Email address" reads as *done*, which is
          the opposite of what this list means. */}
      {reason === "profileIncomplete" && missingFields?.length ? (
        <ul className="list-disc pl-6 text-sm">
          {missingFields.map((field) => (
            <li key={field} className="first-letter:uppercase">
              {field}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-row justify-center gap-4">
        {reason === "profileIncomplete" && (
          <Link
            href="/user/profile"
            className="btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white md:w-[150px]"
          >
            Update profile
          </Link>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn border-purple text-purple hover:bg-purple rounded-full bg-white normal-case hover:text-white md:w-[150px]"
        >
          Close
        </button>
      </div>
    </div>
  );
};
