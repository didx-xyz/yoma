import {
  useOpportunityFeaturedMutation,
  useOpportunityHiddenMutation,
  useOpportunityStatusMutation,
} from "~/hooks/useOpportunityMutations";
import moment from "moment";
import { useRouter } from "next/router";
import { useCallback } from "react";
import {
  FaArchive,
  FaClock,
  FaDownload,
  FaEdit,
  FaExclamation,
  FaExternalLinkAlt,
  FaExternalLinkSquareAlt,
  FaEye,
  FaEyeSlash,
  FaLink,
} from "react-icons/fa";
import { IoIosSettings, IoMdWarning } from "react-icons/io";
import { toast } from "react-toastify";
import {
  Status,
  type OpportunityInfo,
  type SyncInfo,
} from "~/api/models/opportunity";
import {
  DropdownMenu,
  DropdownMenuDisplayStyle,
} from "~/components/Common/DropdownMenu";
import { downloadVerificationFilesAdmin } from "~/api/services/myOpportunities";
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { DEV_MOCK_PULL_SYNC_OPPORTUNITY_ID, ROLE_ADMIN } from "~/lib/constants";
import { analytics } from "~/lib/analytics";
import { getSafeUrl } from "~/lib/utils";

export const SYNC_PARTNER_LABELS: Record<string, string> = {
  SAYouth: "SAYouth",
  Jobberman: "Jobberman",
  Alison: "Alison",
};

/**
 * Returns the effective SyncInfo for an opportunity.
 * Falls back to a dev mock when DEV_MOCK_PULL_SYNC_OPPORTUNITY_ID matches.
 * Remove the mock branch once the API populates syncedInfo.
 */
export function getEffectiveSyncedInfo(
  opportunity: OpportunityInfo,
): SyncInfo | null {
  const raw = opportunity.syncedInfo;
  if (raw) {
    return typeof raw === "string" ? (JSON.parse(raw) as SyncInfo) : raw;
  }
  // 🧪 DEV MOCK
  if (
    DEV_MOCK_PULL_SYNC_OPPORTUNITY_ID &&
    opportunity.id === DEV_MOCK_PULL_SYNC_OPPORTUNITY_ID
  ) {
    return {
      syncType: "Pull",
      partners: ["SAYouth"],
      locked: true,
    };
  }
  return null;
}

const PULL_SYNC_TOOLTIP =
  "This opportunity is managed externally by a sync provider and cannot be modified here.";

export enum OpportunityActionOptions {
  EDIT_DETAILS = "editDetails",
  DOWNLOAD_COMPLETION_FILES = "downloadCompletionFiles",
  COPY_EXTERNAL_LINK = "copyExternalLink",
  VIEW_ATTENDANCE_LINKS = "viewAttendanceLinks",
  CREATE_ATTENDANCE_LINK = "createAttendanceLink",
  MAKE_ACTIVE = "makeActive",
  MAKE_INACTIVE = "makeInactive",
  MAKE_VISIBLE = "makeVisible",
  MAKE_HIDDEN = "makeHidden",
  MARK_FEATURED = "markFeatured",
  UNMARK_FEATURED = "unmarkFeatured",
  DELETE = "delete",
}

export enum OpportunityActionDisplayStyle {
  ICON = "icon",
  BUTTON = "button",
}

interface OpportunityActionsProps {
  opportunity: OpportunityInfo;
  user?: { roles: string[] };
  organizationId: string;
  returnUrl?: string;
  actionOptions?: OpportunityActionOptions[];
  disabled?: boolean;
  displayStyle?: OpportunityActionDisplayStyle;
}

export const OpportunityActions: React.FC<OpportunityActionsProps> = ({
  opportunity,
  user,
  organizationId,
  returnUrl,
  actionOptions = [
    OpportunityActionOptions.EDIT_DETAILS,
    OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
    OpportunityActionOptions.COPY_EXTERNAL_LINK,
    OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
    OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
    OpportunityActionOptions.MAKE_ACTIVE,
    OpportunityActionOptions.MAKE_INACTIVE,
    OpportunityActionOptions.MAKE_VISIBLE,
    OpportunityActionOptions.MAKE_HIDDEN,
    OpportunityActionOptions.MARK_FEATURED,
    OpportunityActionOptions.UNMARK_FEATURED,
    OpportunityActionOptions.DELETE,
  ],
  disabled = false,
  displayStyle = OpportunityActionDisplayStyle.ICON,
}) => {
  const router = useRouter();
  const modalContext = useConfirmationModalContext();
  const isAdmin = user?.roles.includes(ROLE_ADMIN);

  // Pull-sync state
  const syncedInfo = getEffectiveSyncedInfo(opportunity);
  const isPullManaged = syncedInfo?.syncType === "Pull";

  const statusMutation = useOpportunityStatusMutation({
    opportunityId: opportunity.id,
    organizationId,
    title: opportunity.title,
  });
  const hiddenMutation = useOpportunityHiddenMutation({
    opportunityId: opportunity.id,
    organizationId,
    title: opportunity.title,
  });
  const featuredMutation = useOpportunityFeaturedMutation({
    opportunityId: opportunity.id,
    title: opportunity.title,
  });
  const isLoading =
    statusMutation.isPending ||
    hiddenMutation.isPending ||
    featuredMutation.isPending;

  const defaultCopyToClipboard = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard!", { autoClose: 2000 });

      // 📊 ANALYTICS: track external link copy
      analytics.trackEvent("opportunity_external_link_copied", {
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        url: url,
      });
    },
    [opportunity.id, opportunity.title],
  );

  const defaultDownloadCompletionFiles = useCallback(
    async (opportunityId: string) => {
      try {
        await downloadVerificationFilesAdmin({
          opportunity: opportunityId,
          verificationTypes: null,
        });
        toast.success(
          "Your request is scheduled for processing. You will receive an email when the download is ready.",
        );

        // 📊 ANALYTICS: track completion files download
        analytics.trackEvent("opportunity_completion_files_downloaded", {
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
        });
      } catch (error) {
        console.error(error);
        toast.error("Download failed. Please try again later.", {
          autoClose: false,
        });
      }
    },
    [opportunity.id, opportunity.title],
  );

  const handleStatusUpdate = useCallback(
    async (status: Status) => {
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
              {status === Status.Deleted && (
                <>
                  Are you sure you want to <strong>archive</strong> this
                  opportunity?
                  <br />
                  This action is permanent and cannot be undone.
                </>
              )}
              {status === Status.Active && (
                <>
                  Are you sure you want to <strong>activate</strong> this
                  opportunity?
                  <br />
                  You can always inactivate it again later.
                </>
              )}
              {status === Status.Inactive && (
                <>
                  Are you sure you want to <strong>inactivate</strong> this
                  opportunity?
                  <br />
                  You can always activate it again later.
                </>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;
      statusMutation.mutate(status);
    },
    [modalContext, statusMutation],
  );

  const handleHiddenUpdate = useCallback(
    async (hidden: boolean) => {
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
              {hidden && (
                <>
                  Are you sure you want to <strong>hide</strong> this
                  opportunity from search results and public listings?
                  <br />
                  <br />
                  You can always show it again later.
                </>
              )}
              {!hidden && (
                <>
                  Are you sure you want to <strong>show</strong> this
                  opportunity on search results and public listings?
                  <br />
                  <br />
                  You can always hide it again later.
                </>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;
      hiddenMutation.mutate(hidden);
    },
    [modalContext, hiddenMutation],
  );

  const handleFeaturedUpdate = useCallback(
    (featured: boolean) => {
      featuredMutation.mutate(featured);
    },
    [featuredMutation],
  );

  const handleCopyToClipboard = defaultCopyToClipboard;
  const handleDownloadCompletionFiles = defaultDownloadCompletionFiles;

  const menuItems = [
    ...(actionOptions.includes(OpportunityActionOptions.EDIT_DETAILS) &&
    opportunity?.status != "Deleted"
      ? [
          {
            label: "Edit Opportunity Details",
            href: isPullManaged
              ? undefined
              : `/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}?returnUrl=${encodeURIComponent(router.asPath)}`,
            disabled: isPullManaged,
            disabledTooltip: isPullManaged ? PULL_SYNC_TOOLTIP : undefined,
            icon: <FaEdit className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(
      OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
    )
      ? [
          {
            label: "Download Completion Files",
            onClick: () => {
              handleDownloadCompletionFiles(opportunity.id);
            },
            icon: <FaDownload className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.COPY_EXTERNAL_LINK) &&
    opportunity?.url
      ? [
          {
            label: "Copy External Link",
            onClick: () => {
              handleCopyToClipboard(opportunity.url!);
            },
            icon: <FaLink className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.VIEW_ATTENDANCE_LINKS)
      ? [
          {
            label: "View Attendance Links",
            href: `/organisations/${organizationId}/links?entities=${opportunity.id}`,
            icon: <FaExternalLinkSquareAlt className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(
      OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
    ) && opportunity?.status != "Deleted"
      ? [
          {
            label: "Create Attendance Link (Quick Link)",
            href: `/organisations/${organizationId}/links/create?name=${encodeURIComponent(
              `Attendance-${moment().format("DDMMMYYYY")}`,
            )}&description=&entityType=0&entityId=${
              opportunity.id
            }&usagesLimit=&dateEnd=${encodeURIComponent(
              moment().format("DDMMMYYYY"),
            )}&distributionList=&includeQRCode=&lockToDistributionList=false${
              returnUrl
                ? `&returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl, router.asPath),
                  )}`
                : ""
            }`,
            icon: <FaExternalLinkAlt className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.MAKE_INACTIVE) &&
    (opportunity?.status == "Active" ||
      opportunity?.status == "Expired" ||
      (isAdmin && opportunity?.status == "Deleted"))
      ? [
          {
            label: "Make Inactive",
            onClick: () => handleStatusUpdate(Status.Inactive),
            disabled: isPullManaged,
            disabledTooltip: isPullManaged ? PULL_SYNC_TOOLTIP : undefined,
            icon: <FaClock className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.MAKE_ACTIVE) &&
    opportunity?.status == "Inactive"
      ? [
          {
            label: "Make Active",
            onClick: () => handleStatusUpdate(Status.Active),
            disabled: isPullManaged,
            disabledTooltip: isPullManaged ? PULL_SYNC_TOOLTIP : undefined,
            icon: <FaClock className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.MAKE_VISIBLE) &&
    opportunity?.hidden
      ? [
          {
            label: "Make Visible",
            onClick: () => handleHiddenUpdate(false),
            icon: <FaEye className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.MAKE_HIDDEN) &&
    !opportunity?.hidden &&
    opportunity.status !== "Deleted"
      ? [
          {
            label: "Make Hidden",
            onClick: () => handleHiddenUpdate(true),
            icon: <FaEyeSlash className="size-4" />,
          },
        ]
      : []),
    ...(isAdmin &&
    actionOptions.includes(OpportunityActionOptions.UNMARK_FEATURED) &&
    opportunity?.featured
      ? [
          {
            label: "Unmark as Featured",
            onClick: () => handleFeaturedUpdate(false),
            icon: <FaExclamation className="size-4" />,
          },
        ]
      : []),
    ...(isAdmin &&
    actionOptions.includes(OpportunityActionOptions.MARK_FEATURED) &&
    !opportunity?.featured
      ? [
          {
            label: "Mark as Featured",
            onClick: () => handleFeaturedUpdate(true),
            icon: <FaExclamation className="size-4" />,
          },
        ]
      : []),
    ...(actionOptions.includes(OpportunityActionOptions.DELETE) &&
    opportunity?.status != "Deleted"
      ? [
          {
            label: "Archive",
            onClick: () => handleStatusUpdate(Status.Deleted),
            disabled:
              isPullManaged &&
              !(
                isAdmin &&
                (opportunity.status === "Active" ||
                  opportunity.status === "Expired")
              ),
            disabledTooltip: isPullManaged
              ? isAdmin
                ? "Externally-managed opportunities can only be archived when Active or Expired."
                : "Only admins can archive externally-managed opportunities."
              : undefined,
            icon: <FaArchive className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <>
      {isLoading && <Loading />}
      <DropdownMenu
        label={
          displayStyle === OpportunityActionDisplayStyle.BUTTON
            ? "Manage opportunity"
            : "Actions"
        }
        items={menuItems}
        disabled={disabled}
        displayStyle={
          displayStyle === OpportunityActionDisplayStyle.BUTTON
            ? DropdownMenuDisplayStyle.BUTTON
            : DropdownMenuDisplayStyle.ICON
        }
        triggerIcon={
          <IoIosSettings
            className={
              displayStyle === OpportunityActionDisplayStyle.BUTTON
                ? "mr-1 h-5 w-5"
                : "text-green hover:text-blue size-5"
            }
          />
        }
        title="Actions"
        menuClassName="w-64"
      />
    </>
  );
};
