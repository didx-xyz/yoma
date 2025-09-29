import { useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import {
  FaBell,
  FaLink,
  FaQrcode,
  FaSearch,
  FaStar,
  FaTrash,
} from "react-icons/fa";
import { IoIosSettings, IoMdWarning } from "react-icons/io";
import { IoClose, IoShareSocialOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { LinkInfo, LinkStatus } from "~/api/models/actionLinks";
import {
  getLinkById,
  sendInstantVerifyReminders,
  updateLinkStatus,
} from "~/api/services/actionLinks";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { analytics } from "~/lib/analytics";
import { getSafeUrl } from "~/lib/utils";
import CustomModal from "../Common/CustomModal";

export enum LinkActionOptions {
  ACTIVATE = "activate",
  REMIND_PARTICIPANTS = "remindParticipants",
  GO_TO_OVERVIEW = "goToOverview",
  COPY_LINK = "copyLink",
  GENERATE_QR_CODE = "generateQRCode",
  DELETE = "delete",
}

interface LinkActionsProps {
  link: LinkInfo;
  onCopyToClipboard?: (url: string) => void;
  onGenerateQRCode?: (link: LinkInfo) => void;
  returnUrl?: string;
  actionOptions?: LinkActionOptions[];
  organizationId?: string; // Add this to identify the organization for cache invalidation
}

export const LinkActions: React.FC<LinkActionsProps> = ({
  link,
  onCopyToClipboard,
  onGenerateQRCode,
  returnUrl,
  actionOptions = [
    LinkActionOptions.ACTIVATE,
    LinkActionOptions.GO_TO_OVERVIEW,
    LinkActionOptions.COPY_LINK,
    LinkActionOptions.GENERATE_QR_CODE,
    LinkActionOptions.DELETE,
  ],
  organizationId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useConfirmationModalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImageData, setQRCodeImageData] = useState<
    string | null | undefined
  >(null);

  const defaultCopyToClipboard = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard!", { autoClose: 2000 });

      // 📊 ANALYTICS: track link copy
      analytics.trackEvent("link_copied", {
        linkId: link.id,
        linkUrl: url,
        linkName: link.name,
        entityOrganizationId: link.entityOrganizationId,
      });
    },
    [link.id, link.name, link.entityOrganizationId],
  );

  const defaultGenerateQRCode = useCallback(
    (item: LinkInfo) => {
      // 📊 ANALYTICS: track QR code generation
      analytics.trackEvent("link_qr_code_generated", {
        linkId: item.id,
        linkName: item.name,
        entityOrganizationId: item.entityOrganizationId,
      });

      // fetch the QR code
      queryClient
        .fetchQuery({
          queryKey: ["OpportunityLink", item.id],
          queryFn: () => getLinkById(item.id, true),
        })
        .then(() => {
          // get the QR code from the cache
          const qrCode = queryClient.getQueryData<LinkInfo | null>([
            "OpportunityLink",
            item.id,
          ]);

          // show the QR code
          setQRCodeImageData(qrCode?.qrCodeBase64);
          setShowQRCode(true);
        });
    },
    [queryClient],
  );

  const handleStatusUpdate = useCallback(
    async (item: LinkInfo, status: LinkStatus) => {
      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2 text-gray-500"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <div>
            <p className="text-sm leading-6">
              {status === LinkStatus.Active && (
                <>
                  Are you sure you want to <i>activate</i> this link?
                </>
              )}
              {status === LinkStatus.Inactive && (
                <>
                  Are you sure you want to <i>inactivate</i> this link?
                </>
              )}
              {status === LinkStatus.Deleted && (
                <>
                  Are you sure you want to <i>delete</i> this link?
                </>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await updateLinkStatus(item.id, status);

        // 📊 ANALYTICS: track link status update
        analytics.trackEvent("link_status_updated", {
          linkId: item.id,
          status: status,
          entityOrganizationId: item.entityOrganizationId,
        });

        // invalidate cache based on context
        if (organizationId) {
          // Organization context
          await queryClient.invalidateQueries({
            queryKey: ["Links", organizationId],
            exact: false,
          });
          await queryClient.invalidateQueries({
            queryKey: ["Links_TotalCount", organizationId],
            exact: false,
          });
          // For link overview page
          await queryClient.invalidateQueries({
            queryKey: ["Link", item.id],
            exact: false,
          });
        } else {
          // Admin context
          await queryClient.invalidateQueries({
            queryKey: ["Admin", "Links"],
            exact: false,
          });
        }

        toast.success("Link status updated");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: `error-${item.id}`,
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [queryClient, modalContext, organizationId],
  );

  const handleRemindParticipants = useCallback(
    async (item: LinkInfo) => {
      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2 text-gray-500"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
            <p className="text-lg">Confirm</p>
          </div>

          <div>
            <p className="text-sm leading-6">
              Are you sure you want to send reminders to all unclaimed
              participants for this link?
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await sendInstantVerifyReminders(item.id);

        // 📊 ANALYTICS: track reminder sent
        analytics.trackEvent("link_reminders_sent", {
          linkId: item.id,
          linkName: item.name,
          entityOrganizationId: item.entityOrganizationId,
        });

        toast.success("Reminders sent successfully");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: `reminder-error-${item.id}`,
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [modalContext],
  );

  const handleCopyToClipboard = onCopyToClipboard || defaultCopyToClipboard;
  const handleGenerateQRCode = onGenerateQRCode || defaultGenerateQRCode;

  return (
    <>
      {isLoading && <Loading />}

      {/* QR CODE DIALOG */}
      <CustomModal
        isOpen={showQRCode}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setShowQRCode(false);
          setQRCodeImageData(null);
        }}
        className={`md:max-h-[650px] md:w-[600px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          {/* HEADER WITH CLOSE BUTTON */}
          <div className="bg-green flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setShowQRCode(false);
                setQRCodeImageData(null);
              }}
            >
              <IoClose className="h-6 w-6" />
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="border-green-dark -mt-16 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <IoShareSocialOutline className="h-7 w-7" />
            </div>

            <h1 className="text-center text-lg font-semibold">QR Code</h1>
            {showQRCode && qrCodeImageData && (
              <div className="flex w-full flex-col items-center gap-4">
                <div className="flex w-full flex-col items-center gap-4">
                  <Image
                    src={`data:image/png;base64,${qrCodeImageData}`}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="rounded-lg"
                    priority
                  />
                </div>
              </div>
            )}
            <p className="text-center text-sm text-gray-500">
              Share this QR code with participants to allow them to access the
              link.
            </p>
          </div>
        </div>
      </CustomModal>

      <div className="dropdown dropdown-left">
        <button type="button" title="Actions" className="cursor-pointer">
          <IoIosSettings className="text-green hover:text-blue size-5" />
        </button>
        <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-64 gap-2 p-2 shadow">
          {actionOptions.includes(LinkActionOptions.ACTIVATE) &&
            link?.status == "Inactive" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleStatusUpdate(link, LinkStatus.Active)}
                >
                  <FaStar className="text-green size-4" />
                  Activate
                </button>
              </li>
            )}

          {actionOptions.includes(LinkActionOptions.REMIND_PARTICIPANTS) &&
            link?.status == "Active" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleRemindParticipants(link)}
                >
                  <FaBell className="text-green size-4" />
                  Remind Participants
                </button>
              </li>
            )}

          {actionOptions.includes(LinkActionOptions.GO_TO_OVERVIEW) && (
            <li>
              <button
                type="button"
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="Go to Link Overview"
                onClick={() => {
                  void router.push(
                    `/organisations/${link.entityOrganizationId}/links/${link.id}${
                      returnUrl
                        ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                        : ""
                    }`,
                  );
                }}
              >
                <FaSearch className="text-green size-4" />
                Go to Link Overview
              </button>
            </li>
          )}

          {actionOptions.includes(LinkActionOptions.COPY_LINK) && (
            <li>
              <button
                type="button"
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="Copy URL to clipboard"
                onClick={() => {
                  handleCopyToClipboard(link.url!);
                }}
              >
                <FaLink className="text-green size-4" />
                Copy Link
              </button>
            </li>
          )}

          {actionOptions.includes(LinkActionOptions.GENERATE_QR_CODE) && (
            <li>
              <button
                type="button"
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="Generate QR Code"
                onClick={() => {
                  handleGenerateQRCode(link);
                }}
              >
                <FaQrcode className="text-green size-4" />
                Generate QR Code
              </button>
            </li>
          )}

          {actionOptions.includes(LinkActionOptions.DELETE) &&
            (link?.status == "Inactive" || link?.status == "Active") && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => handleStatusUpdate(link, LinkStatus.Deleted)}
                >
                  <FaTrash className="text-green size-4" />
                  Delete
                </button>
              </li>
            )}
        </ul>
      </div>
    </>
  );
};
