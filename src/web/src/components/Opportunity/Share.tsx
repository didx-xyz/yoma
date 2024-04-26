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
import Badges from "./Badges";
import Image from "next/image";
import type { LinkInfo, OpportunityInfo } from "~/api/models/opportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import Moment from "react-moment";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSharingLink } from "~/api/services/opportunities";
import { LoadingInline } from "../Status/LoadingInline";

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
      queryFn: () => createSharingLink(opportunity.id),
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
        queryFn: () => createSharingLink(opportunity.id, true),
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
          className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
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
          <div className="-mt-16 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
            <IoShareSocialOutline className="h-7 w-7" />
          </div>

          <h3>Share this opportunity!</h3>

          {/* OPPORTUNITY DETAILS (smaller) */}
          <div className="flex w-full flex-col rounded-lg border-2 border-dotted border-gray p-4">
            <div className="flex gap-4">
              <div className="">
                <AvatarImage
                  icon={opportunity?.organizationLogoURL ?? null}
                  alt={`${opportunity?.organizationName} Logo`}
                  size={60}
                />
              </div>
              <div className="flex max-w-[200px] flex-col gap-1 sm:max-w-[480px] md:max-w-[420px]">
                <h4 className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-7 text-black md:text-xl md:leading-8">
                  {opportunity?.title}
                </h4>
                <h6 className=" overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-dark">
                  By {opportunity?.organizationName}
                </h6>
              </div>
            </div>

            {/* BADGES */}
            <Badges opportunity={opportunity} />

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
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <button
              onClick={onClick_CopyToClipboard}
              className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-sm font-semibold text-black hover:bg-gray-light md:text-lg"
            >
              <IoCopy className="mr-2 h-6 w-6" />
              Copy Link
            </button>
            <button
              onClick={onClick_GenerateQRCode}
              className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-sm font-semibold text-black hover:bg-gray-light md:text-lg"
            >
              <IoQrCode className="mr-2 h-6 w-6" />
              Generate QR Code
            </button>
            <button
              onClick={onClick_MoreOptions}
              className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-sm font-semibold text-black hover:bg-gray-light md:text-lg"
            >
              <IoEllipsisHorizontalOutline className="mr-2 h-6 w-6 text-black" />
              More options
            </button>
          </div>

          {/* QR CODE */}
          {showQRCode && qrCodeImageData && (
            <>
              <h5>Scan the QR Code with your device&apos;s camera</h5>
              <Image
                src={qrCodeImageData}
                alt="QR Code"
                width={200}
                height={200}
                style={{ width: 200, height: 200 }}
              />
            </>
          )}

          <button
            type="button"
            className="btn mt-10 rounded-full border-purple bg-white normal-case text-purple md:w-[150px]"
            onClick={onClose}
            ref={cancelButtonRef}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SharePopup;
