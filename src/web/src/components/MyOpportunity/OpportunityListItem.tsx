import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import { useRouter } from "next/router";
import FileSaver from "file-saver";
import { downloadVerificationFiles } from "~/api/services/myOpportunities";
import { FaDownload, FaExternalLinkAlt } from "react-icons/fa";
import { IoMdAlert, IoMdCheckmark, IoMdClose } from "react-icons/io";
import PullSyncBadge from "../Opportunity/Badges/PullSyncBadge";

export interface OpportunityListItemBadgeConfig {
  label: string;
  tooltip?: string;
  className?: string;
  icon?: React.ReactElement;
}

export interface OpportunityListItemConfig {
  displayDateLabel?: string;
  showStatusBadge?: boolean;
  showPullSyncBadge?: boolean;
  showProgress?: boolean;
  showDates?: boolean;
  showDownloadFiles?: boolean;
  showComment?: boolean;
  showSkills?: boolean;
  pageContextBadge?: OpportunityListItemBadgeConfig | null;
}

const verificationStatusDisplay: Record<
  string,
  {
    label: string;
    tooltip: string;
    className: string;
    icon: React.ReactElement;
  }
> = {
  Pending: {
    label: "Pending",
    tooltip:
      "Your submission is under review or awaiting an external partner update.",
    className: "bg-yellow-50 text-yellow border border-yellow-200",
    icon: <IoMdAlert className="h-3.5 w-3.5" />,
  },
  Completed: {
    label: "Completed",
    tooltip: "Your submission has been completed successfully.",
    className: "bg-green-light text-green border border-green/10",
    icon: <IoMdCheckmark className="h-3.5 w-3.5" />,
  },
  Rejected: {
    label: "Declined",
    tooltip: "Your submission was declined. Check the comment for more detail.",
    className: "bg-red-50 text-red-500 border border-red-100",
    icon: <IoMdClose className="h-3.5 w-3.5" />,
  },
};

const OpportunityListItem: React.FC<{
  data: MyOpportunityInfo;
  displayDate: string;
  config?: OpportunityListItemConfig;
  [key: string]: any;
}> = ({ data, displayDate, config }) => {
  const router = useRouter();
  const { pathname } = router;

  const resolvedConfig: OpportunityListItemConfig = {
    displayDateLabel: "Updated",
    showStatusBadge: true,
    showPullSyncBadge: true,
    showProgress: true,
    showDates: true,
    showDownloadFiles: true,
    showComment: true,
    showSkills: pathname.includes("completed"),
    ...config,
  };

  const verificationStatus = data.verificationStatus?.toString() ?? null;
  const verificationBadge = verificationStatus
    ? verificationStatusDisplay[verificationStatus]
    : null;
  const pageContextBadge = resolvedConfig.pageContextBadge ?? null;
  const showMetaRow =
    !!pageContextBadge ||
    !!(resolvedConfig.showStatusBadge && verificationBadge) ||
    !!(
      resolvedConfig.showPullSyncBadge && data.syncedInfo?.syncType === "Pull"
    ) ||
    !!displayDate;
  const showProgressBar =
    resolvedConfig.showProgress &&
    data.percentComplete !== null &&
    data.percentComplete !== undefined;
  const hasDownloadableFiles = !!data.verifications?.some((x) => x.fileURL);

  const downloadFiles = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = await downloadVerificationFiles({
      opportunity: data.opportunityId,
      verificationTypes: null,
    });
    if (!file) return;

    FileSaver.saveAs(file);
  };

  const openOpportunity = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.open(
      `/opportunities/${data.opportunityId}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="border-gray shadow-custom flex flex-col gap-3 rounded-lg border-none bg-white p-4">
      <div className="flex flex-row gap-2">
        <AvatarImage
          icon={data.organizationLogoURL ? data.organizationLogoURL : null}
          alt="Organization Logo"
          size={60}
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-ellipsis">
          <h1 className="text-gray-dark line-clamp-1 text-xs font-medium">
            {data.organizationName}
          </h1>
          <h2 className="line-clamp-2 text-[18px] leading-tight font-semibold md:line-clamp-1">
            {data.opportunityTitle}
          </h2>
        </div>
      </div>

      <div className="flex h-full max-h-15 flex-row">
        <p className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-sm font-light">
          {data.opportunitySummary}
        </p>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {showMetaRow && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {pageContextBadge && (
                <div
                  className="tooltip tooltip-top tooltip-secondary w-fit"
                  data-tip={pageContextBadge.tooltip ?? pageContextBadge.label}
                >
                  <span
                    className={`badge gap-1 border-none text-[10px] font-semibold select-none ${pageContextBadge.className ?? "border border-sky-100 bg-sky-50 text-sky-700"}`}
                  >
                    {pageContextBadge.icon}
                    {pageContextBadge.label}
                  </span>
                </div>
              )}

              {resolvedConfig.showStatusBadge && verificationBadge && (
                <div
                  className="tooltip tooltip-top tooltip-secondary w-fit"
                  data-tip={verificationBadge.tooltip}
                >
                  <span
                    className={`badge gap-1 border-none text-[10px] font-semibold select-none ${verificationBadge.className}`}
                  >
                    {verificationBadge.icon}
                    {verificationBadge.label}
                  </span>
                </div>
              )}

              {resolvedConfig.showPullSyncBadge && (
                <PullSyncBadge syncInfo={data.syncedInfo} />
              )}
            </div>

            <div className="text-gray-dark flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-none">
              {displayDate && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span>
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {displayDate}
                    </Moment>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {showProgressBar && (
          <div className="flex flex-col gap-2 md:max-w-1/2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-bold text-black">Progress</span>
              <span className="text-gray-dark">
                {data.percentComplete}% complete
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-blue h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.max(data.percentComplete ?? 0, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* COMMENT */}
        {resolvedConfig.showComment && data.commentVerification && (
          <div className="flex flex-row flex-wrap gap-1">
            <h4 className="line-clamp-4 text-sm font-bold">Comment: </h4>
            <h4 className="line-clamp-4 text-sm font-thin">
              {data.commentVerification}
            </h4>
          </div>
        )}

        {/* SKILLS */}
        {resolvedConfig.showSkills && !!data.skills?.length && (
          <>
            <div className="flex flex-row">
              <h4 className="line-clamp-4 text-sm font-bold">
                Skills developed
              </h4>
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              {data.skills?.map((skill) => (
                <div
                  className="badge bg-green-light text-green truncate rounded-md text-[12px] font-semibold whitespace-nowrap"
                  key={skill.id}
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-secondary"
            onClick={openOpportunity}
            type="button"
          >
            <FaExternalLinkAlt className="size-4" />
            Open Opportunity
          </button>

          {/* DOWNLOAD LINK */}
          {resolvedConfig.showDownloadFiles && hasDownloadableFiles && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={downloadFiles}
              type="button"
            >
              <FaDownload className="size-4" />
              Download your completion files ({data.verifications?.length}{" "}
              total)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { OpportunityListItem };
