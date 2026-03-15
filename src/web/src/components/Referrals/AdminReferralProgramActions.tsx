import { useReferralProgramStatusMutation } from "~/hooks/useReferralProgramMutations";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback } from "react";
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
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
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
  className?: string;
}

export const AdminReferralProgramActions: React.FC<
  ReferralProgramActionsProps
> = ({
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
  className = "text-green hover:brightness-125",
}) => {
  const router = useRouter();
  const modalContext = useConfirmationModalContext();
  const statusMutation = useReferralProgramStatusMutation({
    programId: program.id,
    programName: program.name,
  });
  const isLoading = statusMutation.isPending;

  const handleStatusUpdate = useCallback(
    async (status: ProgramStatus) => {
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
                  Are you sure you want to <i>delete</i> this referral program?
                </>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      statusMutation.mutate(status, {
        onSuccess: () => {
          if (status === ProgramStatus.Deleted) {
            void router.push(
              getSafeUrl(returnUrl, "/admin/referrals?status=Deleted"),
            );
          }
        },
      });
    },
    [modalContext, statusMutation, returnUrl, router],
  );

  return (
    <>
      {isLoading && <Loading />}

      <div className="dropdown dropdown-left">
        <button type="button" title="Actions" className="cursor-pointer">
          <IoIosSettings className={`${className} size-5`} />
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
            program.status === "Inactive" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleStatusUpdate(ProgramStatus.Active)}
                >
                  <FaStar className="text-green size-4" />
                  Activate
                </button>
              </li>
            )}

          {/* INACTIVATE */}
          {actionOptions.includes(ReferralProgramActionOptions.INACTIVATE) &&
            program.status === "Active" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleStatusUpdate(ProgramStatus.Inactive)}
                >
                  <FaStar className="text-green size-4" />
                  Inactivate
                </button>
              </li>
            )}

          {/* DELETE */}
          {actionOptions.includes(ReferralProgramActionOptions.DELETE) &&
            (program.status === "Inactive" ||
              program.status === "Active" ||
              program.status === "LimitReached" ||
              program.status === "UnCompletable") && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center hover:brightness-50"
                  onClick={() => handleStatusUpdate(ProgramStatus.Deleted)}
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
