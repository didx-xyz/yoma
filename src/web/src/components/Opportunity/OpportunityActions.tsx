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
import { Status, type OpportunityInfo } from "~/api/models/opportunity";
import { downloadVerificationFilesAdmin } from "~/api/services/myOpportunities";
import { Loading } from "~/components/Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { ROLE_ADMIN } from "~/lib/constants";
import { analytics } from "~/lib/analytics";
import { getSafeUrl } from "~/lib/utils";

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

  return (
    <>
      {isLoading && <Loading />}
      <div className="dropdown dropdown-left">
        {displayStyle === OpportunityActionDisplayStyle.BUTTON ? (
          <button
            type="button"
            className="bg-theme hover:bg-theme disabled:bg-gray-dark flex w-40 flex-row items-center justify-center rounded-full p-1 text-xs whitespace-nowrap text-white brightness-105 hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <IoIosSettings className="mr-1 h-5 w-5" />
            Manage opportunity
          </button>
        ) : (
          <button
            type="button"
            title="Actions"
            className="cursor-pointer"
            disabled={disabled}
          >
            <IoIosSettings className="text-green hover:text-blue size-5" />
          </button>
        )}
        <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-64 gap-2 p-2 shadow">
          {actionOptions.includes(OpportunityActionOptions.EDIT_DETAILS) &&
            opportunity?.status != "Deleted" && (
              <li>
                <a
                  href={`/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}?returnUrl=${encodeURIComponent(router.asPath)}`}
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                >
                  <FaEdit className="text-green size-4" />
                  Edit Opportunity Details
                </a>
              </li>
            )}

          {/* Download Completion Files */}
          {actionOptions.includes(
            OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
          ) && (
            <li>
              <button
                type="button"
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="Download completion files"
                onClick={() => {
                  handleDownloadCompletionFiles(opportunity.id);
                }}
              >
                <FaDownload className="text-green size-4" />
                Download Completion Files
              </button>
            </li>
          )}

          {/* Copy External Link */}
          {actionOptions.includes(
            OpportunityActionOptions.COPY_EXTERNAL_LINK,
          ) &&
            opportunity?.url && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  title="Copy URL to clipboard"
                  onClick={() => {
                    handleCopyToClipboard(opportunity.url!);
                  }}
                >
                  <FaLink className="text-green size-4" />
                  Copy External Link
                </button>
              </li>
            )}

          {/* View Attendance Links */}
          {actionOptions.includes(
            OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
          ) && (
            <li>
              <a
                href={`/organisations/${organizationId}/links?entities=${opportunity.id}`}
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
              >
                <FaExternalLinkSquareAlt className="text-green size-4" />
                View Attendance Links
              </a>
            </li>
          )}

          {/* Create Attendance Link */}
          {actionOptions.includes(
            OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
          ) &&
            opportunity?.status != "Deleted" && (
              <li>
                <a
                  href={`/organisations/${organizationId}/links/create?name=${encodeURIComponent(
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
                  }`}
                  title="Create Attendance Link"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                >
                  <FaExternalLinkAlt className="text-green size-4" />
                  Create Attendance Link
                  <br />
                  (Quick Link)
                </a>
              </li>
            )}

          {/* Status Actions */}
          {actionOptions.includes(OpportunityActionOptions.MAKE_INACTIVE) &&
            (opportunity?.status == "Active" ||
              opportunity?.status == "Expired" ||
              (isAdmin && opportunity?.status == "Deleted")) && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleStatusUpdate(Status.Inactive)}
                >
                  <FaClock className="text-green size-4" />
                  Make Inactive
                </button>
              </li>
            )}

          {actionOptions.includes(OpportunityActionOptions.MAKE_ACTIVE) &&
            opportunity?.status == "Inactive" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleStatusUpdate(Status.Active)}
                >
                  <FaClock className="text-green size-4" />
                  Make Active
                </button>
              </li>
            )}

          {/* Visibility Actions */}
          {actionOptions.includes(OpportunityActionOptions.MAKE_VISIBLE) &&
            opportunity?.hidden && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleHiddenUpdate(false)}
                >
                  <FaEye className="text-green size-4" />
                  Make Visible
                </button>
              </li>
            )}

          {actionOptions.includes(OpportunityActionOptions.MAKE_HIDDEN) &&
            !opportunity?.hidden &&
            opportunity.status !== "Deleted" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleHiddenUpdate(true)}
                >
                  <FaEyeSlash className="text-green size-4" />
                  Make Hidden
                </button>
              </li>
            )}

          {/* Featured Actions (Admin only) */}
          {isAdmin &&
            actionOptions.includes(OpportunityActionOptions.UNMARK_FEATURED) &&
            opportunity?.featured && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleFeaturedUpdate(false)}
                >
                  <FaExclamation className="text-green size-4" />
                  Unmark as Featured
                </button>
              </li>
            )}

          {isAdmin &&
            actionOptions.includes(OpportunityActionOptions.MARK_FEATURED) &&
            !opportunity?.featured && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleFeaturedUpdate(true)}
                >
                  <FaExclamation className="text-green size-4" />
                  Mark as Featured
                </button>
              </li>
            )}

          {/* Delete Action */}
          {actionOptions.includes(OpportunityActionOptions.DELETE) &&
            opportunity?.status != "Deleted" && (
              <li>
                <button
                  type="button"
                  className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                  onClick={() => handleStatusUpdate(Status.Deleted)}
                >
                  <FaArchive className="text-green size-4" />
                  Archive
                </button>
              </li>
            )}
        </ul>
      </div>
    </>
  );
};
