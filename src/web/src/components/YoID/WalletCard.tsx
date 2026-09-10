import Image from "next/image";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import { useState } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import type { UserProfile } from "~/api/models/user";
import { CashOutEntry } from "../Payout/CashOutEntry";
import { ZltoLedger } from "../Rewards/ZltoLedger";
import NoRowsMessage from "../NoRowsMessage";
import { ZltoModal } from "./ZltoModal";

export const WalletCard: React.FC<{
  userProfile: UserProfile;
}> = ({ userProfile }) => {
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
      <NoRowsMessage
        title={""}
        description={
          "You will receive ZLTO for completing opportunities, which can be spent on the marketplace."
        }
        icon={
          <Image src={iconZltoColor} alt="ZLTO" width={28} className="h-auto" />
        }
      />
    );
  }

  return (
    <>
      <ZltoModal
        isOpen={zltoModalVisible}
        onClose={() => setZltoModalVisible(false)}
      />

      <div className="flex h-full flex-col gap-2 text-xs text-black md:text-sm">
        <div className="text-gray-dark content-center justify-center gap-2">
          <span className="text-xs">
            <span className="font-semibold italic">ZLTO</span> - Your digital
            wallet for rewards.
          </span>

          {/* TOOLTIP */}
          <button
            type="button"
            onClick={() => setZltoModalVisible(true)}
            className="ml-2 inline-block align-middle"
            tabIndex={-1}
          >
            <IoIosInformationCircleOutline className="text-green h-5 w-5" />
          </button>
        </div>

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
             these figures. This card only says which variant it wants. */
          actions={<CashOutEntry profile={userProfile} variant="expanded" />}
        />
      </div>
    </>
  );
};
