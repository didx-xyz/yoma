import { useState, type MouseEventHandler, type ReactNode } from "react";
import type { UserProfile } from "~/api/models/user";
import { CashOutEntry } from "../Payout/CashOutEntry";
import { CashOutWalletLink } from "../Payout/CashOutWalletLink";
import { ZltoLedger } from "../Rewards/ZltoLedger";
import { EmptyState, FIND_OPPORTUNITIES } from "./EmptyState";
import { INTRO_LINK_CLASS } from "./YoIDIntro";
import { ZltoModal } from "./ZltoModal";

/**
 * `link`: the section's "Open Wallet →" (overview and drawer). It leads the card's link row, with
 * "What is ZLTO?" after it on the same line (Jason, 2026-10-22); the wallet page passes none.
 */
export const WalletCard: React.FC<{
  userProfile: UserProfile;
  link?: ReactNode;
  /** Called when the empty state's link is followed (the drawer closes on a plain click). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ userProfile, link, onClick }) => {
  const [zltoModalVisible, setZltoModalVisible] = useState(false);

  const zlto = userProfile?.zlto;

  /**
   * "Nothing yet" means genuinely nothing, and it has to be *known* to be nothing.
   *
   * `total` is null while the reward provider is offline, so the old `?? 0` collapsed "we cannot
   * see your balance" into "you have never earned anything" — the worst reading available. It is
   * only an empty wallet when the server tells us the total is zero and nothing is reserved for a
   * payout: ZLTO in flight has already been taken out of `available` (and so out of `total`), so a
   * youth mid-payout would otherwise be told their earnings never happened.
   */
  if (!zlto || (zlto.total === 0 && zlto.pendingPayout === 0)) {
    return (
      <>
        <EmptyState
          title="No ZLTO yet"
          description="Earn ZLTO by completing opportunities, then spend it in the marketplace."
          action={FIND_OPPORTUNITIES}
          onClick={onClick}
        />
        {link}
      </>
    );
  }

  return (
    <>
      <ZltoModal
        isOpen={zltoModalVisible}
        onClose={() => setZltoModalVisible(false)}
      />

      <div className="flex h-full flex-col gap-2 text-xs text-black md:text-sm">
        {/*
          Centred in whatever space the card has left. A wallet with nothing in flight collapses to
          a single "Available" row, and the Yo-ID dashboard cards are a fixed-height grid — pinned
          to the top, one row left an inch of empty white under it.
        */}
        <ZltoLedger
          zlto={zlto}
          variant="expanded"
          className="flex-1 justify-center"
          /* The Cash Out entry point belongs to the ledger, not to this card: the same button,
             with the same label rules and the same flow behind it, on both surfaces that show
             these figures. This card only says which variant it wants.

             The wallet link is a *sibling*, not part of that flow — it leads to money already sent,
             so it survives the kill-switch and a withdrawn corridor, both of which make
             `CashOutEntry` render nothing. It shows itself only once a cash out has completed. */
          actions={
            <>
              <CashOutEntry profile={userProfile} variant="expanded" />
              <CashOutWalletLink profile={userProfile} variant="expanded" />
            </>
          }
        />

        {/* one row: the way to the section first, then the explainer */}
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          {link}
          <button
            type="button"
            onClick={() => setZltoModalVisible(true)}
            className={`${INTRO_LINK_CLASS} inline-flex min-h-8 items-center md:min-h-6`}
          >
            What is ZLTO?
          </button>
        </div>
      </div>
    </>
  );
};
