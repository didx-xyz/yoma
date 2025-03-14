import React, { useState, useCallback, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import {
  IoCopy,
  IoQrCode,
  IoEllipsisHorizontalOutline,
  IoShareSocialOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { AvatarImage } from "../AvatarImage";
import PublicBadges from "~/components/Opportunity/Badges/PublicBadges";
import Image from "next/image";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import Moment from "react-moment";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingInline } from "../Status/LoadingInline";
import { createLinkSharing } from "~/api/services/actionLinks";
import type { LinkInfo } from "~/api/models/actionLinks";

interface SharePopupProps {
  opportunity: OpportunityInfo;
  onClose: () => void;
}

const SharePopup: React.FC<SharePopupProps> = ({ opportunity, onClose }) => {
  const queryClient = useQueryClient();
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const { data: linkInfo, isLoading: linkInfoIsLoading } =
    useQuery<LinkInfo | null>({
      queryKey: ["OpportunitySharingLink", opportunity.id],
      queryFn: () =>
        createLinkSharing({
          name: null,
          description: null,
          entityType: "Opportunity",
          entityId: opportunity.id,
          includeQRCode: false,
        }),
    });

  const onClick_CopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(linkInfo?.shortURL ?? linkInfo?.uRL ?? "");
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, [linkInfo]);

  const onClick_GenerateQRCode = useCallback(() => {
    // fetch the QR code
    queryClient
      .fetchQuery({
        queryKey: ["OpportunitySharingLinkQR", opportunity.id],
        queryFn: () =>
          createLinkSharing({
            name: null,
            description: null,
            entityType: "Opportunity",
            entityId: opportunity.id,
            includeQRCode: true,
          }),
      })
      .then(() => {
        // get the QR code from the cache
        const qrCode = queryClient.getQueryData<LinkInfo | null>([
          "OpportunitySharingLinkQR",
          opportunity.id,
        ]);

        // show the QR code
        setQRCodeImageData(qrCode?.qrCodeBase64);
        setShowQRCode(true);

        // scroll to the cancel button
        setTimeout(
          () => cancelButtonRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      });
  }, [opportunity.id, queryClient]);

  const onClick_MoreOptions = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({
          title:
            opportunity.title.length > 60
              ? opportunity.title.substring(0, 57) + "..."
              : opportunity.title,
          text:
            opportunity.description.length > 200
              ? opportunity.description.substring(0, 197) + "..."
              : opportunity.description,
          url: linkInfo?.shortURL ?? linkInfo?.uRL ?? "",
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      toast.warn("Share not supported on this browser", { autoClose: 2000 });
      console.log("Share not supported on this browser");
    }
  }, [opportunity, linkInfo]);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      {/* HEADER WITH CLOSE BUTTON */}
      <div className="flex flex-row bg-green p-4 shadow-lg">
        <h1 className="flex-grow"></h1>
        <button
          type="button"
          className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
          onClick={onClose}
        >
          <IoMdClose className="h-6 w-6"></IoMdClose>
        </button>
      </div>

      {/* LOADING */}
      {linkInfoIsLoading && (
        <div className="flex items-center justify-center">
          <div className="flex h-[300px] w-full max-w-md flex-col items-center justify-center gap-1 rounded-lg bg-white">
            <LoadingInline />
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!linkInfoIsLoading && (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="-mt-16 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-orange shadow-lg">
            <IoShareSocialOutline className="h-7 w-7 text-white" />
          </div>

          <h3>Share this opportunity!</h3>

          {/* OPPORTUNITY DETAILS (smaller) */}
          <div className="mt-4 flex w-full flex-col rounded-lg p-4 shadow-custom">
            <div className="flex gap-4">
              <div className="mb-1 flex items-center">
                <AvatarImage
                  icon={opportunity?.organizationLogoURL ?? null}
                  alt={`${opportunity?.organizationName} Logo`}
                  size={60}
                />
              </div>
              <div className="flex flex-col gap-1 md:max-w-[420px]">
                <h4 className="line-clamp-2 max-w-[170px] overflow-hidden text-ellipsis text-[18px] font-semibold leading-tight md:max-w-[420px]">
                  {opportunity?.title}
                </h4>
                <h6 className="line-clamp-2 max-w-[180px] overflow-hidden text-ellipsis text-xs font-medium text-gray-dark md:max-w-[420px]">
                  By {opportunity?.organizationName}
                </h6>
              </div>
            </div>

            {/* BADGES */}
            <PublicBadges opportunity={opportunity} />

            {/* DATES */}
            {opportunity?.status == "Active" && (
              <div className="flex flex-col text-sm text-gray-dark">
                <div>
                  {opportunity.dateStart && (
                    <>
                      <span className="mr-2 font-bold">Starts:</span>
                      <span className="text-xs tracking-widest text-black">
                        <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                          {opportunity.dateStart}
                        </Moment>
                      </span>
                    </>
                  )}
                </div>
                <div>
                  {opportunity.dateEnd && (
                    <>
                      <span className="mr-2 font-bold">Ends:</span>
                      <span className="text-xs tracking-widest text-black">
                        <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                          {opportunity.dateEnd}
                        </Moment>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div className="mb-2 mt-10 grid w-full grid-cols-1 gap-4 md:mb-6 md:grid-cols-2">
            <button
              onClick={onClick_CopyToClipboard}
              className="btn btn-outline btn-primary"
            >
              <IoCopy className="mr-2 h-6 w-6" />
              Copy Link
            </button>
            <button
              onClick={onClick_GenerateQRCode}
              className="btn btn-outline btn-primary"
            >
              <IoQrCode className="mr-2 h-6 w-6" />
              Generate QR Code
            </button>

            <button
              onClick={onClick_MoreOptions}
              className="btn btn-outline btn-primary md:hidden"
            >
              <IoEllipsisHorizontalOutline className="mr-2 h-6 w-6" />
              More options
            </button>
          </div>

          {/* QR CODE */}
          {showQRCode && qrCodeImageData && (
            <span className="mt-4">
              <h5 className="text-center">
                Scan the QR Code with your device&apos;s camera
              </h5>
              <Image
                src={qrCodeImageData}
                alt="QR Code"
                width={320}
                height={320}
                className="h-auto"
              />
            </span>
          )}

          {showQRCode && (
            <button
              type="button"
              className="btn btn-primary w-full md:w-[168px]"
              onClick={onClose}
              ref={cancelButtonRef}
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SharePopup;
