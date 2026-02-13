import Image from "next/image";
import { useCallback, useState } from "react";
import { IoMdCopy, IoMdDownload } from "react-icons/io";
import { IoQrCode } from "react-icons/io5";
import { toast } from "react-toastify";
import type { ReferralLink } from "~/api/models/referrals";
import { getReferralLinkById } from "~/api/services/referrals";

interface LinkDetailsProps {
  link: ReferralLink;
  showQRCode?: boolean;
  showShortLink?: boolean;
  showCopyButton?: boolean;
  className?: string;
}

export const ReferrerLinkDetails: React.FC<LinkDetailsProps> = ({
  link,
  showQRCode: showQRCodeProp = true,
  showShortLink: showShortLinkProp = true,
  showCopyButton: showCopyButtonProp = true,
  className = "rounded-lg bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm md:p-6",
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

  return (
    <div className={className}>
      <div className="flex flex-col gap-6">
        {/* Short URL - Compact */}
        {showShortLinkProp && displayLink.shortURL && (
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-2">
              <div className="font-family-nunito font-semibold text-black">
                Link
              </div>
              <p className="text-base-content/60 mt-0.5 text-sm">
                Copy and share this link with your friends
              </p>
            </div>

            <div className="flex w-full items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  value={displayLink.shortURL}
                  readOnly
                  className="border-orange w-full truncate rounded border border-dashed bg-white px-2 py-1.5 font-mono text-[11px] font-semibold text-gray-900 focus:outline-none"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
              {showCopyButtonProp && (
                <button
                  type="button"
                  onClick={() => handleCopyLink(displayLink.shortURL)}
                  className="btn btn-xs bg-orange flex-shrink-0 gap-1 text-white hover:brightness-110"
                  title="Copy short link"
                >
                  <IoMdCopy className="h-3 w-3" />
                  <span className="text-[10px]">Copy</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* QR Code - Compact */}
        {showQRCodeProp && (
          <div className="min-w-0">
            <div className="mb-2">
              <div className="font-family-nunito font-semibold text-black">
                QR Code
              </div>
              <p className="text-base-content/60 mt-0.5 text-sm">
                Scan to share or download for offline use
              </p>
            </div>

            {showQRCode && displayLink.qrCodeBase64 ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="rounded border border-dashed border-blue-300 bg-white p-1.5 shadow-sm">
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
                    className="btn btn-xs bg-orange gap-1 text-white hover:brightness-110"
                    title="Download QR code"
                  >
                    <IoMdDownload className="h-3 w-3" />
                    <span className="text-[10px]">Download</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleQR}
                disabled={loadingQR}
                className="btn btn-xs bg-orange gap-1 text-white hover:brightness-110"
              >
                {loadingQR ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span className="text-[10px]">Loading QR Code...</span>
                  </>
                ) : (
                  <>
                    <IoQrCode className="h-3 w-3" />
                    <span className="text-[10px]">Show QR Code</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
