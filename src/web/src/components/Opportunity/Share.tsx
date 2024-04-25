// SharePopup.tsx
import React, { useState, useRef } from "react";
import { FaFacebook, FaLinkedin, FaQrcode } from "react-icons/fa";
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
import iconBell from "public/images/icon-bell.webp";
import iconBookmark from "public/images/icon-bookmark.svg";
import Image from "next/image";
import { OpportunityInfo } from "~/api/models/opportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import Moment from "react-moment";

interface SharePopupProps {
  opportunity: OpportunityInfo;
  onClose: () => void;
}

const SharePopup: React.FC<SharePopupProps> = ({ opportunity, onClose }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    );
    toast("URL copied to clipboard!");
  };
  const generateQRCode = () => {
    setShowQRCode(true);
  };

  // const shareOnFacebook = () => {
  //   window.open(
  //     `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  //     "_blank",
  //   );
  // };

  // const shareOnLinkedIn = () => {
  //   window.open(
  //     `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
  //       url,
  //     )}`,
  //     "_blank",
  //   );
  // };

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
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

      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="-mt-16 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
          {/* <Image
            src={iconBell}
            alt="Icon Bell"
            width={28}
            height={28}
            sizes="100vw"
            priority={true}
            style={{ width: "28px", height: "28px" }}
          /> */}
          <IoShareSocialOutline className="h-7 w-7" />
        </div>

        <h3>Share this opportunity!</h3>

        {/* OPPORTUNITY DETAILS (smaller) */}
        <div className="flex w-full flex-col rounded-lg border-2 border-dotted border-gray p-4">
          <div className="flex gap-4">
            <div className="">
              <AvatarImage
                icon={opportunity?.organizationLogoURL ?? null}
                alt="Company Logo"
                size={60}
                // sizeMobile={42}
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
            onClick={copyToClipboard}
            className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-sm font-semibold text-black hover:bg-gray-light md:text-lg"
          >
            <IoCopy className="mr-2 h-6 w-6" />
            Copy Link
          </button>
          <button
            onClick={generateQRCode}
            className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-sm font-semibold text-black hover:bg-gray-light md:text-lg"
          >
            <IoQrCode className="mr-2 h-6 w-6" />
            Generate QR Code
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({
                    title: "Page Title",
                    text: "Page description",
                    url: "https://example.com", // replace with your URL
                  })
                  .then(() => console.log("Successful share"))
                  .catch((error) => console.log("Error sharing", error));
              } else {
                console.log("Share not supported on this browser");
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-sm font-semibold text-black hover:bg-gray-light md:text-lg"
          >
            <IoEllipsisHorizontalOutline className="mr-2 h-6 w-6 text-black" />
            More options
          </button>
        </div>

        {showQRCode && (
          // <img
          //   src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          //     url,
          //   )}`}
          //   alt="QR Code"
          // />
          <Image
            src={iconBookmark}
            alt="QR Code"
            width={47}
            height={35}
            style={{ width: 47, height: 35 }}
          />
        )}
      </div>
    </div>
  );
};

export default SharePopup;
