import Image from "next/image";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import { useEffect, useState } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { UserProfile } from "~/api/models/user";
import { ZltoModal } from "./ZltoModal";

export const WalletCard: React.FC<{
  userProfile: UserProfile;
}> = ({ userProfile }) => {
  const [zltoModalVisible, setZltoModalVisible] = useState(false);
  const [processing, setProcessing] = useState("");
  const [available, setAvailable] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() => {
    if (userProfile?.zlto) {
      if (userProfile.zlto.zltoOffline) {
        setProcessing(userProfile.zlto.pending.toLocaleString());
        setAvailable("Unable to retrieve value");
        setTotal(userProfile.zlto.total.toLocaleString());
      } else {
        setProcessing(userProfile.zlto.pending.toLocaleString());
        setAvailable(userProfile.zlto.available.toLocaleString());
        setTotal(userProfile.zlto.total.toLocaleString());
      }
    }
  }, [userProfile]);

  return (
    <>
      <ZltoModal
        isOpen={zltoModalVisible}
        onClose={() => setZltoModalVisible(false)}
      />

      <div className="flex flex-col gap-2 text-black">
        <div className="flex items-center gap-2 text-sm">
          ZLTO
          {/* TOOLTIP */}
          <button type="button" onClick={() => setZltoModalVisible(true)}>
            <IoIosInformationCircleOutline className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-1 border-y-2 border-dotted border-[#FFD69C] py-2">
          <div className="flex flex-row items-center">
            <p className="w-28 text-xs tracking-widest">Available:</p>

            <div className="flex items-center text-xs font-semibold text-black">
              <Image
                src={iconZltoColor}
                className="mr-2"
                alt="ZLTO"
                width={18}
                height={18}
              />
              {available ?? "Loading..."}
            </div>
          </div>
          <div className="flex flex-row items-center">
            <p className="w-28 text-xs tracking-widest">Processing:</p>

            <div className="flex items-center text-xs font-semibold text-black">
              <Image
                src={iconZltoColor}
                className="mr-2"
                alt="ZLTO"
                width={18}
                height={18}
              />
              {processing ?? "Loading..."}
            </div>
          </div>
        </div>
        <div className="relative flex flex-row items-center">
          <p className="w-28 text-xs tracking-widest">Total:</p>
          <div className="badge -ml-2 !rounded-full bg-white px-2 py-2 text-xs !font-semibold text-black">
            <Image
              src={iconZltoColor}
              className="mr-2"
              alt="ZLTO"
              width={18}
              height={18}
            />
            {total ?? "Loading..."}
          </div>
        </div>
      </div>
    </>
  );
};
