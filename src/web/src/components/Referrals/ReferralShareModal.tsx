import React from "react";
import { IoMdClose } from "react-icons/io";
import CustomModal from "~/components/Common/CustomModal";
import { ReferrerLinkDetails } from "./ReferrerLinkDetails";
import { ShareButtons } from "./ShareButtons";
import type { ReferralLink } from "~/api/models/referrals";

interface ReferralShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ReferralLink | null;
  rewardAmount?: number | null;
}

export const ReferralShareModal: React.FC<ReferralShareModalProps> = ({
  isOpen,
  onClose,
  link,
  rewardAmount,
}) => {
  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="h-fitxxx w-fitxxx md:max-h-[550px] md:w-[450px]"
    >
      {link && (
        <div className="flex flex-col">
          <div className="bg-theme flex flex-row p-4 shadow-lg">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">
                Share Your Link
              </h1>
            </div>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray btn-sm"
              onClick={onClose}
            >
              <IoMdClose className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-3 md:p-6">
            <ReferrerLinkDetails
              link={link}
              className="w-full min-w-0"
              showQRCode={true}
              showShortLink={true}
              showCopyButton={true}
            />

            <div className="flex w-full min-w-0 flex-col md:flex-1 md:basis-1/2">
              <div className="font-family-nunito font-semibold text-black">
                Share Link
              </div>
              <div className="text-base-content/60 mb-4 text-sm">
                Share your link on your preferred platform
              </div>
              <ShareButtons
                url={link.shortURL ?? link.url}
                size={30}
                rewardAmount={rewardAmount}
              />
            </div>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange flex-1 normal-case hover:text-white"
                onClick={onClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomModal>
  );
};
