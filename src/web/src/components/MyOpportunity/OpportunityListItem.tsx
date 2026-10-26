import { useQuery } from "@tanstack/react-query";
import FileSaver from "file-saver";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaDownload } from "react-icons/fa";
import { IoMdAlert, IoMdCheckmark, IoMdClose } from "react-icons/io";
import Moment from "react-moment";
import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import type { OpportunityType } from "~/api/models/opportunity";
import {
  downloadVerificationFiles,
  getVerificationStatus,
} from "~/api/services/myOpportunities";
import {
  OPPORTUNITY_QUERY_KEYS,
  useOpportunityTypesQuery,
} from "~/hooks/useOpportunityMutations";
import {
  CARD_ACTION_CLASS,
  CARD_BAND_CLASS,
  CARD_CHIP_CLASS,
  CARD_LOGO_CLASS,
  CARD_TITLE_CLASS,
} from "~/lib/card";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import {
  typeBadgeClass,
  typeBandClass,
  typeLabel,
  typeOutlineClass,
} from "~/lib/typeColours";
import PullSyncBadge from "../Opportunity/Badges/PullSyncBadge";
import { MyOpportunityCustomFieldsSection } from "../Opportunity/MyOpportunityCustomFieldsSection";

/** Until the types lookup arrives a label falls back to the enum name. */
const NO_TYPES: OpportunityType[] = [];

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
  fetchVerificationStatus?: boolean;
  showDates?: boolean;
  showDownloadFiles?: boolean;
  showComment?: boolean;
  showSkills?: boolean;
  /** Show hydrated completion custom-field metadata (YOM-1244 / YOM-1255). */
  showCustomFields?: boolean;
  /** Optional whitelist/order of custom-field keys to show (keep cards compact). */
  customFieldsWhitelist?: string[];
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

/**
 * A YoID opportunity card (completed / pending / declined / saved) in the discovery card's
 * language (`features/discovery/components/Results/OpportunityCard.tsx`, which takes
 * precedence): the organisation logo on the type's tinted band, the type chip, title,
 * organisation and summary in reserved slots so a row of cards lines up, and the type-coloured
 * action at the foot. Colours are the shared BA Review palette (`lib/typeColours.ts`).
 *
 * Unlike a discovery card the height is not fixed: the youth's own record — progress, the
 * verification comment, skills developed, completion custom fields — varies per item and is never
 * clipped. The grid stretches a row to its tallest card, and the action stays at the foot.
 *
 * No `overflow-hidden` on the card: the status badges' tooltips must escape it, so the band
 * rounds its own top corners instead.
 */
const OpportunityListItem: React.FC<{
  data: MyOpportunityInfo;
  displayDate: string;
  config?: OpportunityListItemConfig;
}> = ({ data, displayDate, config }) => {
  const router = useRouter();
  const { pathname } = router;
  const { data: types = NO_TYPES } = useOpportunityTypesQuery();

  const resolvedConfig: OpportunityListItemConfig = {
    displayDateLabel: "Updated",
    showStatusBadge: true,
    showPullSyncBadge: true,
    showProgress: true,
    fetchVerificationStatus: false,
    showDates: true,
    showDownloadFiles: true,
    showComment: true,
    showSkills: pathname.includes("completed"),
    showCustomFields: true, //TODO: enable when unblocked by (YOM-1244): Temporary development field; replace with the BA-approved definition.
    ...config,
  };

  const { data: fetchedVerificationStatus } = useQuery({
    queryKey: OPPORTUNITY_QUERY_KEYS.verificationStatus(data.opportunityId),
    queryFn: () => getVerificationStatus(data.opportunityId),
    enabled: resolvedConfig.fetchVerificationStatus,
  });

  const resolvedData = fetchedVerificationStatus
    ? {
        ...data,
        verificationStatus:
          fetchedVerificationStatus.status ?? data.verificationStatus,
        percentComplete:
          fetchedVerificationStatus.percentComplete ?? data.percentComplete,
        dateCompleted:
          fetchedVerificationStatus.dateCompleted ?? data.dateCompleted,
        commentVerification:
          fetchedVerificationStatus.comment ?? data.commentVerification,
        syncedInfo: fetchedVerificationStatus.syncedInfo ?? data.syncedInfo,
      }
    : data;

  const verificationStatus =
    resolvedData.verificationStatus?.toString() ?? null;
  const verificationBadge = verificationStatus
    ? verificationStatusDisplay[verificationStatus]
    : null;
  const pageContextBadge = resolvedConfig.pageContextBadge ?? null;
  const showProgressBar =
    resolvedConfig.showProgress &&
    resolvedData.percentComplete !== null &&
    resolvedData.percentComplete !== undefined;
  const downloadableFiles =
    resolvedData.verifications?.filter((x) => x.fileURL).length ?? 0;
  const type = resolvedData.opportunityType;

  const downloadFiles = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = await downloadVerificationFiles({
      opportunity: resolvedData.opportunityId,
      verificationTypes: null,
    });
    if (!file) return;

    FileSaver.saveAs(file);
  };

  return (
    <article className="shadow-custom flex h-full flex-col rounded-xl bg-white">
      <div className={`${CARD_BAND_CLASS} rounded-t-xl ${typeBandClass(type)}`}>
        {resolvedData.organizationLogoURL && (
          <Image
            src={resolvedData.organizationLogoURL}
            alt=""
            width={48}
            height={48}
            // straight from storage, like `AvatarImage`: the optimizer path failed on Stage
            unoptimized
            className={CARD_LOGO_CLASS}
          />
        )}
      </div>

      <div className="flex grow flex-col gap-1.5 p-3">
        <div className="flex min-h-5 flex-wrap items-center justify-between gap-1">
          <span className={`${CARD_CHIP_CLASS} ${typeBadgeClass(type)}`}>
            {typeLabel(types, type)}
          </span>

          <div className="flex flex-wrap items-center justify-end gap-1">
            {resolvedConfig.showPullSyncBadge && (
              <PullSyncBadge syncInfo={resolvedData.syncedInfo} />
            )}

            {pageContextBadge && (
              <div
                className="tooltip tooltip-left tooltip-secondary w-fit"
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
                className="tooltip tooltip-left tooltip-secondary w-fit"
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
          </div>
        </div>

        <h3 className={CARD_TITLE_CLASS}>{resolvedData.opportunityTitle}</h3>
        <p className="h-4 truncate text-xs leading-4 font-semibold text-black">
          {resolvedData.organizationName}
        </p>
        <p className="text-gray-dark line-clamp-2 h-8 shrink-0 text-xs leading-4">
          {resolvedData.opportunitySummary}
        </p>

        {resolvedConfig.showDates && displayDate && (
          <p className="text-gray-dark text-xs leading-4">
            {resolvedConfig.displayDateLabel}{" "}
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {displayDate}
            </Moment>
          </p>
        )}

        {showProgressBar && (
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-black">Progress</span>
              <span className="text-gray-dark">
                {resolvedData.percentComplete}% complete
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all motion-reduce:transition-none ${typeBadgeClass(type)}`}
                style={{
                  width: `${Math.min(Math.max(resolvedData.percentComplete ?? 0, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* COMMENT */}
        {resolvedConfig.showComment && resolvedData.commentVerification && (
          <p className="pt-1 text-xs leading-4">
            <span className="font-semibold">Comment: </span>
            <span className="text-gray-dark">
              {resolvedData.commentVerification}
            </span>
          </p>
        )}

        {/* SKILLS */}
        {resolvedConfig.showSkills && !!resolvedData.skills?.length && (
          <div className="flex flex-col gap-1 pt-1">
            <p className="text-xs font-semibold">Skills developed</p>
            <div className="flex flex-wrap gap-1">
              {resolvedData.skills.map((skill) => (
                <span
                  className="bg-green-light text-green line-clamp-2 max-w-full rounded px-1.5 py-0.5 text-left text-[10px] font-semibold"
                  key={skill.id}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOM FIELDS (definition-driven, YOM-1244 / YOM-1255) */}
        {/* Definitions load per opportunity only when the item has values; the
            section renders nothing otherwise. */}
        {resolvedConfig.showCustomFields &&
          !!resolvedData.customFields?.length && (
            <MyOpportunityCustomFieldsSection
              opportunityId={resolvedData.opportunityId}
              values={resolvedData.customFields}
              fields={resolvedConfig.customFieldsWhitelist}
              className="flex flex-col text-xs"
            />
          )}

        <div className="mt-auto flex shrink-0 items-center gap-2 pt-2">
          <Link
            href={`/opportunities/${resolvedData.opportunityId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CARD_ACTION_CLASS} grow ${typeBadgeClass(type)}`}
          >
            View opportunity
          </Link>

          {/* DOWNLOAD LINK */}
          {resolvedConfig.showDownloadFiles && downloadableFiles > 0 && (
            <button
              type="button"
              onClick={downloadFiles}
              title={`Download your completion files (${downloadableFiles})`}
              aria-label={`Download your completion files (${downloadableFiles})`}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white transition hover:brightness-110 motion-reduce:transition-none ${typeOutlineClass(type)}`}
            >
              <FaDownload className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export { OpportunityListItem };
