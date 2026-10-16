import { IoOpenOutline } from "react-icons/io5";
import type { UserProfile } from "~/api/models/user";
import { WALLET_ACCESS_COPY } from "~/lib/payout/copy";
import { isSafeExternalUrl } from "~/lib/payout/handoff";
import type { ZltoLedgerVariant } from "../Rewards/ZltoLedger";

/**
 * The way back to money already cashed out: a link to the wallet the provider holds for this youth
 * (API 2026-09-25). They sign in there, see what is in it, and retry a delivery if one did not
 * land.
 *
 * **Why it is not part of `CashOutEntry`.** That component returns `null` when the environment
 * kill-switch is off — and wallet access is *independent* of it. Money already sent is not new
 * initiation, and shutting the door to it because new cash outs are paused would strand a youth
 * away from their own funds. Same for country availability: a withdrawn corridor stops new payouts,
 * not access to old ones. So this is a sibling action in the ledger's slot, not a branch inside the
 * flow, and it has no opinion about eligibility, the gate, or an active payout.
 *
 * **What it may not do**, and the list is short because the flag is narrow:
 *
 * - **No claim about the wallet.** `walletAvailable` means one exists. It is not a balance, not a
 *   successful bank or mobile-money delivery, and not proof anything is retryable. `Completed` is
 *   Yoma-to-wallet completion; delivery happens afterwards and can still fail. Nothing here says
 *   otherwise, and nothing derived from it may either.
 * - **No provider call, and no `GET /user/payout/latest`.** The profile already carries both
 *   fields; asking anything else to render a link would put a request on the wallet card.
 * - **Top-level, never the iframe.** This is a durable landing page the youth signs into, not a
 *   30-minute payment session — the hosted-journey frame is the wrong container and the payment URL
 *   is the wrong URL.
 */

const STYLES: Record<ZltoLedgerVariant, string> = {
  /**
   * The sky-blue band: a transparent bordered pill, the same shape the hero's other secondary
   * actions use, so the white-filled Cash Out stays the one primary thing on that row.
   */
  compact:
    "btn !border-blue-dark rounded-full !border-2 !border-solid !bg-transparent text-white brightness-110 hover:!border-white hover:!brightness-100",
  /** The white card: the product's outlined secondary, quieter than Cash Out's filled purple. */
  expanded:
    "btn border-gray text-gray-dark hover:bg-gray-light w-full rounded-full border bg-white normal-case",
};

export const CashOutWalletLink: React.FC<{
  profile: UserProfile;
  variant: ZltoLedgerVariant;
}> = ({ profile, variant }) => {
  const url = profile.payout?.walletUrl;

  /*
    Both conditions, not either. `walletAvailable` is the API's answer about this youth; the URL
    check is about the environment's configuration, which is where the realistic failure is — the
    landing URL is required at API startup but is a per-environment value, and a link to nowhere on
    a money screen is worse than no link.

    `=== true` rather than truthiness for the same reason as `payout.enabled`: absent means an API
    older than 2026-09-25, and that is "we cannot tell", not "yes".
  */
  if (profile.payout?.walletAvailable !== true || !isSafeExternalUrl(url))
    return null;

  return (
    <a
      href={url!}
      target="_blank"
      rel="noopener noreferrer"
      // Third-party site, so `noopener` is not optional: it denies the opened page a handle back
      // into this one. `noreferrer` keeps Yoma's URL out of its logs.
      className={`flex flex-row items-center gap-2 whitespace-nowrap ${STYLES[variant]}`}
    >
      <IoOpenOutline className="h-4 w-4 shrink-0" aria-hidden="true" />
      {WALLET_ACCESS_COPY.action}
      {/* Said, not just implied by the icon — a new tab on someone else's site is worth announcing
          before it appears rather than after. */}
      <span className="sr-only">{WALLET_ACCESS_COPY.opensElsewhere}</span>
    </a>
  );
};
