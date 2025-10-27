import { useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { FaBan, FaEye, FaTrash, FaUnlock } from "react-icons/fa";
import { IoIosSettings, IoMdWarning } from "react-icons/io";
import { toast } from "react-toastify";
import { ReferralLink, ReferralLinkStatus } from "~/api/models/referrals";
import {
  cancelReferralLink,
  blockReferrer,
  unblockReferrer,
} from "~/api/services/referrals";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { analytics } from "~/lib/analytics";
import { getSafeUrl } from "~/lib/utils";
import CustomModal from "../Common/CustomModal";
import {
  BlockUnblockForm,
  type BlockFormData,
  type UnblockFormData,
} from "./BlockUnblockForm";

export enum ReferralLinkActionOptions {
  VIEW_USAGE = "viewUsage",
  CANCEL = "cancel",
  BLOCK_UNBLOCK = "blockUnblock",
}

interface ReferralLinkActionsProps {
  link: ReferralLink;
  returnUrl?: string;
  actionOptions?: ReferralLinkActionOptions[];
}

export const ReferralLinkActions: React.FC<ReferralLinkActionsProps> = ({
  link,
  returnUrl,
  actionOptions = [
    ReferralLinkActionOptions.VIEW_USAGE,
    ReferralLinkActionOptions.BLOCK_UNBLOCK,
    ReferralLinkActionOptions.CANCEL,
  ],
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useConfirmationModalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [modalBlockUnblockVisible, setModalBlockUnblockVisible] =
    useState(false);

  // Helper to get status as enum value
  const getStatusEnum = (link: ReferralLink): ReferralLinkStatus | null => {
    if (!link.status) return null;
    // If it's already an enum
    if (typeof link.status === "string") {
      return link.status as ReferralLinkStatus;
    }

    return null;
  };

  const handleBlockUnblock = useCallback(
    async (data: BlockFormData | UnblockFormData) => {
      setIsLoading(true);
      setModalBlockUnblockVisible(false);

      try {
        if (link.blocked) {
          // Unblock
          await unblockReferrer(data as UnblockFormData);

          // 📊 ANALYTICS: track unblock
          analytics.trackEvent("referral_user_unblocked", {
            userId: link.userId,
            linkId: link.id,
            programId: link.programId,
          });

          toast.success("User unblocked successfully");
        } else {
          // Block
          await blockReferrer(data as BlockFormData);

          // 📊 ANALYTICS: track block
          analytics.trackEvent("referral_user_blocked", {
            userId: link.userId,
            linkId: link.id,
            programId: link.programId,
          });

          toast.success("User blocked successfully");
        }

        // invalidate cache
        await queryClient.invalidateQueries({
          queryKey: ["referralLinks"],
          exact: false,
        });
        await queryClient.invalidateQueries({
          queryKey: ["referralLink", link.id],
          exact: false,
        });
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: `error-block-${link.id}`,
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);
    },
    [link, queryClient],
  );

  const handleCancelLink = useCallback(
    async (item: ReferralLink) => {
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
              Are you sure you want to <i>cancel</i> this referral link? This
              action cannot be undone.
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await cancelReferralLink(item.id);

        // 📊 ANALYTICS: track link cancellation
        analytics.trackEvent("referral_link_cancelled", {
          linkId: item.id,
          linkName: item.name,
          programId: item.programId,
        });

        // invalidate cache
        await queryClient.invalidateQueries({
          queryKey: ["referralLinks"],
          exact: false,
        });
        await queryClient.invalidateQueries({
          queryKey: ["referralLink", item.id],
          exact: false,
        });

        toast.success("Referral link cancelled");
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
    [queryClient, modalContext],
  );

  return (
    <>
      {isLoading && <Loading />}

      {/* MODAL DIALOG FOR BLOCK/UNBLOCK */}
      <CustomModal
        isOpen={modalBlockUnblockVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => setModalBlockUnblockVisible(false)}
        className={`md:max-h-[620px] md:w-[800px]`}
      >
        <BlockUnblockForm
          userId={link.userId}
          isBlocked={link.blocked}
          onSubmit={handleBlockUnblock}
          onClose={() => setModalBlockUnblockVisible(false)}
        />
      </CustomModal>

      <div className="dropdown dropdown-left">
        <button type="button" title="Actions" className="cursor-pointer">
          <IoIosSettings className="text-green hover:text-blue size-5" />
        </button>
        <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 gap-2 p-2 shadow">
          {/* VIEW USAGE */}
          {actionOptions.includes(ReferralLinkActionOptions.VIEW_USAGE) && (
            <li>
              <Link
                href={`/admin/referrals/${link.programId}/links/${link.id}/usage?userIdReferrer=${link.userId}${
                  returnUrl
                    ? `&returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                    : ""
                }`}
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="View Link Usage"
              >
                <FaEye className="text-green size-4" />
                View Usage
              </Link>
            </li>
          )}

          {/* BLOCK/UNBLOCK */}
          {actionOptions.includes(ReferralLinkActionOptions.BLOCK_UNBLOCK) && (
            <li>
              <button
                type="button"
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title={link.blocked ? "Unblock User" : "Block User"}
                onClick={() => setModalBlockUnblockVisible(true)}
              >
                {link.blocked ? (
                  <>
                    <FaUnlock className="text-green size-4" />
                    Unblock User
                  </>
                ) : (
                  <>
                    <FaBan className="text-green size-4" />
                    Block User
                  </>
                )}
              </button>
            </li>
          )}

          {/* CANCEL */}
          {actionOptions.includes(ReferralLinkActionOptions.CANCEL) &&
            getStatusEnum(link) === ReferralLinkStatus.Active && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => handleCancelLink(link)}
                >
                  <FaTrash className="text-green size-4" />
                  Cancel Link
                </button>
              </li>
            )}
        </ul>
      </div>
    </>
  );
};
