import { useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import {
  FaEdit,
  FaEye,
  FaLink as FaLinkIcon,
  FaStar,
  FaTrash,
} from "react-icons/fa";
import { IoIosSettings, IoMdWarning } from "react-icons/io";
import { toast } from "react-toastify";
import { Program, ProgramItem, ProgramStatus } from "~/api/models/referrals";
import { updateReferralProgramStatus } from "~/api/services/referrals";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { analytics } from "~/lib/analytics";
import { getSafeUrl } from "~/lib/utils";

export enum ReferralProgramActionOptions {
  VIEW = "view",
  EDIT = "edit",
  VIEW_LINKS = "viewLinks",
  ACTIVATE = "activate",
  INACTIVATE = "inactivate",
  DELETE = "delete",
}

interface ReferralProgramActionsProps {
  program: Program | ProgramItem;
  returnUrl?: string;
  actionOptions?: ReferralProgramActionOptions[];
}

export const AdminReferralProgramActions: React.FC<ReferralProgramActionsProps> = ({
  program,
  returnUrl,
  actionOptions = [
    ReferralProgramActionOptions.VIEW,
    ReferralProgramActionOptions.EDIT,
    ReferralProgramActionOptions.VIEW_LINKS,
    ReferralProgramActionOptions.ACTIVATE,
    ReferralProgramActionOptions.INACTIVATE,
    ReferralProgramActionOptions.DELETE,
  ],
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useConfirmationModalContext();
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get status as enum value
  const getStatusEnum = (
    program: Program | ProgramItem,
  ): ProgramStatus | null => {
    if (!program.status) return null;
    // If it's already an enum
    if (typeof program.status === "string") {
      return program.status as ProgramStatus;
    }

    return null;
  };

  const handleStatusUpdate = useCallback(
    async (item: Program | ProgramItem, status: ProgramStatus) => {
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
              {status === ProgramStatus.Active && (
                <>
                  Are you sure you want to <i>activate</i> this referral
                  program?
                </>
              )}
              {status === ProgramStatus.Inactive && (
                <>
                  Are you sure you want to <i>inactivate</i> this referral
                  program?
                </>
              )}
              {status === ProgramStatus.Deleted && (
                <>
                  Are you sure you want to <i>archive</i> this referral program?
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
        await updateReferralProgramStatus(item.id, status);

        // 📊 ANALYTICS: track program status update
        analytics.trackEvent("referral_program_status_updated", {
          programId: item.id,
          programName: item.name,
          status: status,
        });

        // invalidate cache
        await queryClient.invalidateQueries({
          queryKey: ["referralPrograms"],
          exact: false,
        });
        await queryClient.invalidateQueries({
          queryKey: ["referralProgram", item.id],
          exact: false,
        });

        toast.success("Program status updated");
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

      <div className="dropdown dropdown-left">
        <button type="button" title="Actions" className="cursor-pointer">
          <IoIosSettings className="text-green hover:text-blue size-5" />
        </button>
        <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 gap-2 p-2 shadow">
          {/* VIEW */}
          {actionOptions.includes(ReferralProgramActionOptions.VIEW) && (
            <li>
              <Link
                href={`/admin/referrals/${program.id}/info${
                  returnUrl
                    ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                    : ""
                }`}
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="View Program Details"
              >
                <FaEye className="text-green size-4" />
                View Details
              </Link>
            </li>
          )}

          {/* VIEW REFERRAL LINKS */}
          {actionOptions.includes(ReferralProgramActionOptions.VIEW_LINKS) && (
            <li>
              <Link
                href={`/admin/referrals/${program.id}/links${
                  returnUrl
                    ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                    : ""
                }`}
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="View Referral Links"
              >
                <FaLinkIcon className="text-green size-4" />
                View Referral Links
              </Link>
            </li>
          )}

          {/* EDIT */}
          {actionOptions.includes(ReferralProgramActionOptions.EDIT) && (
            <li>
              <Link
                href={`/admin/referrals/${program.id}${
                  returnUrl
                    ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                    : ""
                }`}
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="Edit Program"
              >
                <FaEdit className="text-green size-4" />
                Edit Program
              </Link>
            </li>
          )}

          {/* ACTIVATE */}
          {actionOptions.includes(ReferralProgramActionOptions.ACTIVATE) &&
            getStatusEnum(program) === ProgramStatus.Inactive && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() =>
                    handleStatusUpdate(program, ProgramStatus.Active)
                  }
                >
                  <FaStar className="text-green size-4" />
                  Activate
                </button>
              </li>
            )}

          {/* INACTIVATE */}
          {actionOptions.includes(ReferralProgramActionOptions.INACTIVATE) &&
            getStatusEnum(program) === ProgramStatus.Active && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() =>
                    handleStatusUpdate(program, ProgramStatus.Inactive)
                  }
                >
                  <FaStar className="text-green size-4" />
                  Inactivate
                </button>
              </li>
            )}

          {/* DELETE */}
          {actionOptions.includes(ReferralProgramActionOptions.DELETE) &&
            (getStatusEnum(program) === ProgramStatus.Inactive ||
              getStatusEnum(program) === ProgramStatus.Active) && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() =>
                    handleStatusUpdate(program, ProgramStatus.Deleted)
                  }
                >
                  <FaTrash className="text-green size-4" />
                  Archive
                </button>
              </li>
            )}
        </ul>
      </div>
    </>
  );
};
