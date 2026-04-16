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
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Program, ProgramItem, ProgramStatus } from "~/api/models/referrals";
import {
  DropdownMenu,
  DropdownMenuDisplayStyle,
} from "~/components/Common/DropdownMenu";
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import {
  useReferralProgramHiddenMutation,
  useReferralProgramStatusMutation,
} from "~/hooks/useReferralProgramMutations";
import { getSafeUrl } from "~/lib/utils";

export enum ReferralProgramActionOptions {
  VIEW = "view",
  EDIT = "edit",
  VIEW_LINKS = "viewLinks",
  ACTIVATE = "activate",
  INACTIVATE = "inactivate",
  DELETE = "delete",
  TOGGLE_HIDDEN = "toggleHidden",
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
    ReferralProgramActionOptions.TOGGLE_HIDDEN,
  ],
  className = "text-green hover:brightness-125",
}) => {
  const router = useRouter();
  const modalContext = useConfirmationModalContext();
  const statusMutation = useReferralProgramStatusMutation({
    programId: program.id,
    programName: program.name,
  });
  const hiddenMutation = useReferralProgramHiddenMutation({
    programId: program.id,
    programName: program.name,
  });
  const isLoading = statusMutation.isPending || hiddenMutation.isPending;

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

  const menuItems = [
    ...(actionOptions.includes(ReferralProgramActionOptions.VIEW)
      ? [
          {
            label: "View Details",
            href: `/admin/referrals/${program.id}/info${
              returnUrl
                ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                : ""
            }`,
            icon: <FaEye className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(ReferralProgramActionOptions.VIEW_LINKS)
      ? [
          {
            label: "View Referral Links",
            href: `/admin/referrals/${program.id}/links${
              returnUrl
                ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                : ""
            }`,
            icon: <FaLinkIcon className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(ReferralProgramActionOptions.EDIT)
      ? [
          {
            label: "Edit Program",
            href: `/admin/referrals/${program.id}${
              returnUrl
                ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                : ""
            }`,
            icon: <FaEdit className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(ReferralProgramActionOptions.ACTIVATE) &&
    program.status === "Inactive"
      ? [
          {
            label: "Activate",
            onClick: () => handleStatusUpdate(ProgramStatus.Active),
            icon: <FaStar className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(ReferralProgramActionOptions.INACTIVATE) &&
    program.status === "Active"
      ? [
          {
            label: "Inactivate",
            onClick: () => handleStatusUpdate(ProgramStatus.Inactive),
            icon: <FaStar className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(ReferralProgramActionOptions.DELETE) &&
    (program.status === "Inactive" ||
      program.status === "Active" ||
      program.status === "LimitReached" ||
      program.status === "UnCompletable")
      ? [
          {
            label: "Delete",
            onClick: () => handleStatusUpdate(ProgramStatus.Deleted),
            icon: <FaTrash className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(ReferralProgramActionOptions.TOGGLE_HIDDEN) &&
    program.status !== "Deleted"
      ? [
          {
            label: program.hidden ? "Unhide" : "Hide",
            onClick: () => hiddenMutation.mutate(!program.hidden),
            icon: program.hidden ? (
              <IoEyeOutline className="size-4" />
            ) : (
              <IoEyeOffOutline className="size-4" />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {isLoading && <Loading />}

      <DropdownMenu
        label="Actions"
        items={menuItems}
        displayStyle={DropdownMenuDisplayStyle.ICON}
        triggerIcon={<IoIosSettings className={`${className} size-5`} />}
        title="Actions"
      />
    </>
  );
};
