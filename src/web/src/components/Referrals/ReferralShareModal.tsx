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
      className="md:max-h-[700px] md:w-[700px]"
    >
      {link && (
        <div className="flex flex-col gap-2">
          <div className="bg-purple flex flex-row p-4 shadow-lg">
            <div className="grow"></div>
            <button
              type="button"
              className="btn btn-circle btn-sm bg-purple-shade border-0 text-white shadow-none hover:opacity-80"
              onClick={onClose}
            >
              <IoMdClose className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="border-green-dark -mt-11 mb-2 flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-white p-1 shadow-lg md:h-[4.5rem] md:w-[4.5rem]">
              <span
                className="text-xl md:text-2xl"
                role="img"
                aria-label="Link"
              >
                🔗
              </span>
            </div>

            <div className="px-6 text-center">
              <h2 className="text-lg font-semibold text-black">
                Share Your Link
              </h2>
              <div className="text-gray-dark mt-2 text-sm">
                Share your referral link on your preferred platform.
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="border-base-300 bg-base-100 flex flex-col gap-4 overflow-visible rounded-lg border p-4">
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
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="btn btn-outline border-green btn-sm text-green hover:bg-green w-1/2 normal-case hover:text-white"
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
