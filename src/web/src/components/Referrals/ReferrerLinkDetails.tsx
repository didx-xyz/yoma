import Image from "next/image";
import { useCallback, useState } from "react";
import { IoMdCopy, IoMdDownload } from "react-icons/io";
import { IoLink, IoQrCode } from "react-icons/io5";
import { toast } from "react-toastify";
import type { ReferralLink } from "~/api/models/referrals";
import { getReferralLinkById } from "~/api/services/referrals";

interface LinkDetailsProps {
  link: ReferralLink;
  mode?: "large" | "small";
  showQRCode?: boolean;
  showShortLink?: boolean;
  showCopyButton?: boolean;
  className?: string;
}

export const ReferrerLinkDetails: React.FC<LinkDetailsProps> = ({
  link,
  mode = "large",
  showQRCode: showQRCodeProp = true,
  showShortLink: showShortLinkProp = true,
  showCopyButton: showCopyButtonProp = true,
  className = "rounded-lg bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm",
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
      <div className={className}>
        <div className="flex flex-col gap-6">
          {/* TODO: debug */}
          {/* {displayLink.url} */}

          {/* Short URL - Compact */}
          {showShortLinkProp && displayLink.shortURL && (
            <div className="min-w-0">
              {/* Header */}
              <div className="mb-2">
                <div className="text-base-content/70 flex items-center gap-1 text-[11px] font-semibold md:text-xs">
                  <IoLink className="h-3.5 w-3.5 opacity-70" />
                  Short Link
                </div>
                <p className="mt-0.5 text-[10px] text-gray-600">
                  Copy and share this link with your friends
                </p>
              </div>

              <div className="flex min-w-0 items-center gap-1">
                <input
                  type="text"
                  value={displayLink.shortURL}
                  readOnly
                  className="w-full truncate rounded border border-dashed border-blue-300 bg-white px-2 py-1.5 font-mono text-[11px] font-semibold text-gray-900 md:max-w-[320px]"
                  onClick={(e) => e.currentTarget.select()}
                />
                {showCopyButtonProp && (
                  <button
                    type="button"
                    onClick={() => handleCopyLink(displayLink.shortURL)}
                    className="btn btn-xs gap-1 border-blue-600 bg-blue-600 text-white transition-all hover:scale-105 hover:bg-blue-700"
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
                <div className="text-base-content/70 flex items-center gap-1 text-[11px] font-semibold md:text-xs">
                  <IoQrCode className="h-3.5 w-3.5 opacity-70" />
                  QR Code
                </div>
                <p className="mt-0.5 text-[10px] text-gray-600">
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
                      className="btn btn-xs gap-1 border-blue-600 bg-blue-600 text-white transition-all hover:scale-105 hover:bg-blue-700"
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
                  className="btn btn-xs gap-1 border-blue-600 bg-blue-600 text-white transition-all hover:scale-105 hover:bg-blue-700 disabled:!bg-blue-600"
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
  }

  // Large mode (default)
  return (
    <div className={className}>
      {/* TODO: debug */}
      {/* {displayLink.url} */}

      {/* Short URL */}
      {showShortLinkProp && displayLink.shortURL && (
        <div className="mb-4">
          {/* Header */}
          <div className="mb-3">
            <div className="text-base-content/70 flex items-center gap-2 text-[11px] font-semibold md:text-xs">
              <IoLink className="h-5 w-5 opacity-70" />
              Short Link
            </div>
            <p className="text-gray-dark mt-1 text-xs md:text-sm">
              Copy and share this link with your friends
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <input
              type="text"
              value={displayLink.shortURL}
              readOnly
              className="max-w-[250px] min-w-0 flex-1 rounded-lg border-2 border-dashed border-blue-300 bg-white p-3 font-mono text-sm font-semibold text-gray-900"
              onClick={(e) => e.currentTarget.select()}
            />
            {showCopyButtonProp && (
              <button
                type="button"
                onClick={() => handleCopyLink(displayLink.shortURL)}
                className="btn btn-sm flex-shrink-0 gap-2 border-blue-600 bg-blue-600 text-white transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-md"
              >
                <IoMdCopy className="h-4 w-4" />
                Copy
              </button>
            )}
          </div>
        </div>
      )}

      {/* QR Code */}
      {showQRCodeProp && (
        <div className="mb-4">
          <div className="mb-3">
            <div className="text-base-content/70 flex items-center gap-2 text-[11px] font-semibold md:text-xs">
              <IoQrCode className="h-5 w-5 opacity-70" />
              QR Code
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Scan to share or download for offline use
            </p>
          </div>

          {showQRCode && displayLink.qrCodeBase64 ? (
            <>
              <div className="flex items-center gap-4">
                <div className="rounded-lg border-2 border-dashed border-blue-300 bg-white p-2 shadow">
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
                  className="btn btn-sm flex-shrink-0 gap-2 border-blue-600 bg-blue-600 text-white transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-md"
                >
                  <IoMdDownload className="h-4 w-4" />
                  Download
                </button>
              </div>
              {/* <button
                type="button"
                onClick={handleToggleQR}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
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
              className="flex items-center gap-2 text-base font-bold underline transition-colors hover:text-blue-700 disabled:opacity-50"
            >
              {loadingQR ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading QR Code...
                </>
              ) : (
                <>
                  <IoQrCode className="h-4 w-4 opacity-70" />
                  Show QR Code
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
