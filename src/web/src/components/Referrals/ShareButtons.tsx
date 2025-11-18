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
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title = "Check out this opportunity on Yoma!",
  description = "Join me and earn rewards by completing programs on Yoma.",
  size = 40,
}) => {
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
    <div className="flex flex-wrap justify-center gap-3">
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
