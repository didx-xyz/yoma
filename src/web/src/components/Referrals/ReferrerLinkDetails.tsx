import Image from "next/image";
import { useCallback, useState } from "react";
import { IoMdCopy, IoMdDownload } from "react-icons/io";
import { IoLink, IoQrCode } from "react-icons/io5";
import { toast } from "react-toastify";
import type { ReferralLink } from "~/api/models/referrals";
import { getReferralLinkById } from "~/api/services/referrals";
import { ShareButtons } from "./ShareButtons";

interface LinkDetailsProps {
  link: ReferralLink;
  mode?: "large" | "small";
  showQRCode?: boolean;
  showShare?: boolean;
  shareTitle?: string;
  shareDescription?: string;
}

export const ReferrerLinkDetails: React.FC<LinkDetailsProps> = ({
  link,
  mode = "large",
  showQRCode: showQRCodeProp = true,
  showShare = false,
  shareTitle = "Check out this opportunity on Yoma!",
  shareDescription = "Join me on Yoma and earn rewards together.",
}) => {
  const [showQRCode, setShowQRCode] = useState(!!link.qrCodeBase64);
  const [linkWithQR, setLinkWithQR] = useState<ReferralLink | null>(
    link.qrCodeBase64 ? link : null,
  );
  const [loadingQR, setLoadingQR] = useState(false);

  // Copy to clipboard
  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", { autoClose: 2000 });
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  // Download QR code
  const handleDownloadQR = useCallback((qrCode: string, linkName: string) => {
    try {
      const linkEl = document.createElement("a");
      linkEl.href = qrCode;
      linkEl.download = `${linkName}-qr-code.png`;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
      toast.success("QR code downloaded!", { autoClose: 2000 });
    } catch {
      toast.error("Failed to download QR code");
    }
  }, []);

  // Toggle QR code visibility and fetch if needed
  const handleToggleQR = useCallback(async () => {
    // If already showing, just hide it
    if (showQRCode) {
      setShowQRCode(false);
      return;
    }

    // If we don't have the QR code yet, fetch it
    if (!linkWithQR?.qrCodeBase64) {
      setLoadingQR(true);
      try {
        const fullLink = await getReferralLinkById(link.id, true);
        setLinkWithQR(fullLink);
        setShowQRCode(true);
      } catch (error) {
        console.error("Failed to load QR code:", error);
        toast.error("Failed to load QR code");
      } finally {
        setLoadingQR(false);
      }
    } else {
      // Already have it, just show it
      setShowQRCode(true);
    }
  }, [link.id, linkWithQR, showQRCode]);

  const displayLink = linkWithQR || link;

  if (mode === "small") {
    return (
      <div className="rounded-lg bg-gradient-to-br from-green-50 to-white p-3 shadow-sm">
        {/* Short URL - Compact */}
        {displayLink.shortURL && (
          <div className="mb-3">
            {/* Header */}
            <div className="mb-2">
              <h4 className="flex items-center gap-1 text-xs font-bold text-green-900">
                <IoLink className="h-3.5 w-3.5" />
                Short Link
              </h4>
              <p className="mt-0.5 text-[10px] text-gray-600">
                Copy and share this link with your friends
              </p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={displayLink.shortURL}
                readOnly
                className="flex-1 truncate rounded border border-dashed border-green-300 bg-white px-2 py-1.5 font-mono text-[11px] font-semibold text-gray-900"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => handleCopyLink(displayLink.shortURL)}
                className="btn btn-xs gap-1 border-green-600 bg-green-600 text-white transition-all hover:scale-105 hover:bg-green-700"
                title="Copy short link"
              >
                <IoMdCopy className="h-3 w-3" />
                <span className="text-[10px]">Copy</span>
              </button>
            </div>
          </div>
        )}

        {/* QR Code - Compact */}
        {showQRCodeProp && (
          <div className="mb-3">
            {showQRCode && displayLink.qrCodeBase64 ? (
              <>
                {/* Header */}
                <div className="mb-2">
                  <h4 className="flex items-center gap-1 text-xs font-bold text-green-900">
                    <IoQrCode className="h-3.5 w-3.5" />
                    QR Code
                  </h4>
                  <p className="mt-0.5 text-[10px] text-gray-600">
                    Scan to share or download for offline use
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded border border-dashed border-green-300 bg-white p-1.5 shadow-sm">
                    <Image
                      src={displayLink.qrCodeBase64}
                      alt="QR Code"
                      width={80}
                      height={80}
                      className="h-auto"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadQR(
                        displayLink.qrCodeBase64!,
                        displayLink.name,
                      )
                    }
                    className="btn btn-xs gap-1 border-green-600 bg-green-600 text-white transition-all hover:scale-105 hover:bg-green-700"
                    title="Download QR code"
                  >
                    <IoMdDownload className="h-3 w-3" />
                    <span className="text-[10px]">Download</span>
                  </button>
                </div>
                {/* <button
                  type="button"
                  onClick={handleToggleQR}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600 transition-colors hover:text-green-700"
                >
                  <IoQrCode className="h-4 w-4" />
                  Hide QR Code
                </button> */}
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleQR}
                disabled={loadingQR}
                className="flex cursor-pointer items-center gap-1 text-xs font-bold text-green-900 underline transition-colors hover:text-green-700 disabled:opacity-50"
                style={{ minWidth: "130px" }}
              >
                {loadingQR ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Loading QR Code...
                  </>
                ) : (
                  <>
                    <IoQrCode className="h-3.5 w-3.5" />
                    Show QR Code
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Share Buttons - Compact */}
        {showShare && (
          <div className="mt-3 border-t border-green-200 pt-3">
            <div className="mb-2">
              <h4 className="flex items-center gap-1 text-xs font-bold text-green-900">
                📢 Share Your Link
              </h4>
              <p className="mt-0.5 text-[10px] text-gray-600">
                Choose your preferred platform
              </p>
            </div>
            <ShareButtons
              url={link.shortURL ?? link.url}
              title={shareTitle}
              description={shareDescription}
              size={36}
            />
          </div>
        )}
      </div>
    );
  }

  // Large mode (default)
  return (
    <div className="rounded-lg bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
      {/* Short URL */}
      {displayLink.shortURL && (
        <div className="mb-4">
          {/* Header */}
          <div className="mb-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-green-900">
              <IoLink className="h-5 w-5" />
              Short Link
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Copy and share this link with your friends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={displayLink.shortURL}
              readOnly
              className="flex-1 rounded-lg border-2 border-dashed border-green-300 bg-white p-3 font-mono text-sm font-semibold text-gray-900"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => handleCopyLink(displayLink.shortURL)}
              className="btn btn-sm gap-2 border-green-600 bg-green-600 whitespace-nowrap text-white transition-all hover:scale-105 hover:bg-green-700 hover:shadow-md"
            >
              <IoMdCopy className="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>
      )}
      {/* QR Code */}
      {showQRCodeProp && (
        <div className="mb-4">
          {showQRCode && displayLink.qrCodeBase64 ? (
            <>
              {/* Header */}
              <div className="mb-3">
                <h3 className="flex items-center gap-2 text-base font-bold text-green-900">
                  <IoQrCode className="h-5 w-5" />
                  QR Code
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Scan to share or download for offline use
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-lg border-2 border-dashed border-green-300 bg-white p-2 shadow">
                  <Image
                    src={displayLink.qrCodeBase64}
                    alt="QR Code"
                    width={120}
                    height={120}
                    className="h-auto"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadQR(
                      displayLink.qrCodeBase64!,
                      displayLink.name,
                    )
                  }
                  className="btn btn-sm gap-2 border-green-600 bg-green-600 whitespace-nowrap text-white transition-all hover:scale-105 hover:bg-green-700 hover:shadow-md"
                >
                  <IoMdDownload className="h-4 w-4" />
                  Download
                </button>
              </div>
              {/* <button
                type="button"
                onClick={handleToggleQR}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-green-600 transition-colors hover:text-green-700"
              >
                <IoQrCode className="h-5 w-5" />
                Hide QR Code
              </button> */}
            </>
          ) : (
            <button
              type="button"
              onClick={handleToggleQR}
              disabled={loadingQR}
              className="flex items-center gap-2 text-base font-bold text-green-900 transition-colors hover:text-green-700 disabled:opacity-50"
              style={{ minWidth: "160px" }}
            >
              {loadingQR ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading QR Code...
                </>
              ) : (
                <>
                  <IoQrCode className="h-5 w-5" />
                  Show QR Code
                </>
              )}
            </button>
          )}
        </div>
      )}
      {/* Share Buttons */}
      {showShare && (
        <div className="mt-4 border-t border-green-200 pt-4">
          <div className="mb-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-green-900">
              📢 Share Your Link
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Choose your preferred platform to share
            </p>
          </div>
          <ShareButtons
            url={link.shortURL ?? link.url}
            title={shareTitle}
            description={shareDescription}
            size={48}
          />
        </div>
      )}
    </div>
  );
};
