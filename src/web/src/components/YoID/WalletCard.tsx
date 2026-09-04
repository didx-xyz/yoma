import Image from "next/image";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import { useState } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import type { UserProfile } from "~/api/models/user";
import NoRowsMessage from "../NoRowsMessage";
import { ZltoModal } from "./ZltoModal";

export const WalletCard: React.FC<{
  userProfile: UserProfile;
}> = ({ userProfile }) => {
  const [zltoModalVisible, setZltoModalVisible] = useState(false);

  const zlto = userProfile?.zlto;
  /** rewards awaiting processing — the field formerly called `pending` */
  const pendingAwards = zlto?.pendingAwards ?? 0;
  /** already reserved by the reward provider for an in-flight payout, so no longer in `available` */
  const pendingPayout = zlto?.pendingPayout ?? 0;

  const processing = pendingAwards.toLocaleString();
  const available = zlto?.zltoOffline
    ? "Unable to retrieve value"
    : (zlto?.available ?? 0).toLocaleString();
  const total = (zlto?.total ?? 0).toLocaleString();

  /**
   * "Nothing yet" means genuinely nothing. ZLTO reserved for a payout has already been taken out of
   * `available` (and so out of `total`) by the provider, so a youth mid-payout would otherwise be
   * told they have never earned anything while their ZLTO is in flight.
   */
  if ((zlto?.total ?? 0) === 0 && pendingPayout === 0) {
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
        <div className="text-gray-dark h-full content-center justify-center gap-2">
          <span className="text-xs">
            <span className="font-semibold italic">ZLTO</span> - Your digital
            wallet for managing rewards and transactions.
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
        <div className="flex flex-col gap-1 border-y-2 border-dotted border-[#FFD69C] py-2">
          <div className="flex flex-row items-center">
            <p className="w-28">Available:</p>

            <div className="flex items-center text-xs font-semibold text-black">
              <Image
                src={iconZltoColor}
                className="mr-2 h-auto"
                alt="ZLTO"
                width={18}
              />
              {available}
            </div>
          </div>
          <div className="flex flex-row items-center">
            <p className="w-28">Processing:</p>

            <div className="flex items-center text-xs font-semibold text-black">
              <Image
                src={iconZltoColor}
                className="mr-2 h-auto"
                alt="ZLTO"
                width={18}
              />
              {processing}
            </div>
          </div>

          {/* Only while a payout is in flight — this ZLTO is committed and no longer spendable,
              so leaving it out would make the balance look like it had simply dropped. */}
          {pendingPayout > 0 && (
            <div className="flex flex-row items-center">
              <p className="w-28">Paying out:</p>

              <div className="flex items-center text-xs font-semibold text-black">
                <Image
                  src={iconZltoColor}
                  className="mr-2 h-auto"
                  alt="ZLTO"
                  width={18}
                />
                {pendingPayout.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="relative flex flex-row items-center">
          <p className="w-28 font-bold">Total:</p>
          <div className="badge -ml-2 !rounded-full bg-white px-2 py-2 !font-semibold text-black">
            <Image
              src={iconZltoColor}
              className="mr-2 h-auto"
              alt="ZLTO"
              width={18}
            />
            {total}
          </div>
        </div>
      </div>
    </>
  );
};
