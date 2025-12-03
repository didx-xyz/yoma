import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
} from "react-share";
import { IoShareOutline } from "react-icons/io5";
import { toast } from "react-toastify";

interface ShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  size?: number;
  rewardAmount?: number | null;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title: customTitle,
  description: customDescription,
  size = 40,
  rewardAmount,
}) => {
  // Calculate title and description based on reward amount if not explicitly provided
  const title =
    customTitle ||
    (rewardAmount
      ? `Join me on Yoma and earn ${rewardAmount} ZLTO!`
      : "Join me on Yoma!");

  const description =
    customDescription ||
    (rewardAmount
      ? `Join me on Yoma and earn ${rewardAmount} ZLTO! Sign up to build your digital CV and access opportunities.`
      : "Join me on Yoma! Sign up to build your digital CV and access opportunities.");

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          toast.error("Failed to share");
        }
      }
    } else {
      toast.info("Sharing is not supported on this browser");
    }
  };

  return (
    <div className="justify-centerx flex flex-wrap gap-3">
      <WhatsappShareButton url={url} title={title}>
        <WhatsappIcon size={size} round />
      </WhatsappShareButton>

      <TwitterShareButton url={url} title={title}>
        <TwitterIcon size={size} round />
      </TwitterShareButton>

      <LinkedinShareButton url={url} title={title} summary={description}>
        <LinkedinIcon size={size} round />
      </LinkedinShareButton>

      <FacebookShareButton url={url} hashtag="#Yoma">
        <FacebookIcon size={size} round />
      </FacebookShareButton>

      <TelegramShareButton url={url} title={title}>
        <TelegramIcon size={size} round />
      </TelegramShareButton>

      {/* Native Share Button */}
      <button
        onClick={handleNativeShare}
        className="flex cursor-pointer items-center justify-center rounded-full bg-gray-600 text-white transition-all hover:scale-110 hover:bg-gray-700"
        style={{ width: size, height: size }}
        title="More sharing options"
        type="button"
      >
        <IoShareOutline style={{ fontSize: size * 0.5 }} />
      </button>
    </div>
  );
};
