import React, { useState } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDownOutline,
  IoPeople,
  IoStatsChartOutline,
  IoShareSocialOutline,
  IoTime,
  IoWalletOutline,
} from "react-icons/io5";
import Moment from "react-moment";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { withMockReferralStats } from "~/lib/referrals/referralStatsMock";
import { ReferrerLinkDetails } from "./ReferrerLinkDetails";
import { ReferrerPerformanceOverview } from "./ReferrerPerformanceOverview";
import { ReferrerReferralsList } from "./ReferrerReferralsList";
import { ShareButtons } from "./ShareButtons";

interface ReferrerLinkRowProps {
  link: ReferralLink;
  programs: ProgramInfo[];
  isExpanded?: boolean;
}

export const ReferrerLinkRow: React.FC<ReferrerLinkRowProps> = ({
  link,
  programs,
  isExpanded: initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  // Logic from ReferrerLinkCard
  const program = programs.find((p) => p.id === link.programId);

  const hasStatus = !!link.status;
  const statusLabel = hasStatus
    ? link.status === "LimitReached"
      ? "Limit Reached"
      : link.status
    : "—";

  const statusDotClasses = !hasStatus
    ? "bg-gray-300"
    : link.status === "Active"
      ? "bg-green-500"
      : link.status === "Cancelled"
        ? "bg-gray-500"
        : link.status === "LimitReached"
          ? "bg-orange-500"
          : link.status === "Expired"
            ? "bg-red-500"
            : "bg-gray-500";

  const linkStats = withMockReferralStats(
    {
      totalReferrals: link.usageTotal || 0,
      completed: link.completionTotal || 0,
      pending: link.pendingTotal || 0,
      zltoEarned: Math.round(link.zltoRewardCumulative || 0),
    },
    "link",
  );

  const performanceIndicatorItems = [
    {
      key: "totalReferrals",
      label: "Total referrals",
      value: linkStats.totalReferrals,
      icon: <IoPeople className="h-4 w-4 shrink-0 text-blue-600 opacity-70" />,
    },
    {
      key: "completed",
      label: "Completed",
      value: linkStats.completed,
      icon: (
        <IoCheckmarkCircle className="text-success h-4 w-4 shrink-0 opacity-70" />
      ),
    },
    {
      key: "pending",
      label: "Pending",
      value: linkStats.pending,
      icon: <IoTime className="text-warning h-4 w-4 shrink-0 opacity-70" />,
    },
    {
      key: "zlto",
      label: "ZLTO earned",
      value: linkStats.zltoEarned,
      icon: (
        <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
      ),
    },
  ];

  return (
    <div className="border-base-300 bg-base-100 overflow-visible rounded-lg border">
      {/* Header / Title Row */}
      <div className="p-4 select-none">
        <div className="flex min-w-0 items-center gap-3">
          {/* 1) Link name (with date + status) */}
          <div className="min-w-0 grow">
            <button
              type="button"
              onClick={toggleExpanded}
              className="font-family-nunito flex w-full min-w-0 grow flex-col items-start bg-transparent p-0 text-left"
              aria-expanded={isExpanded}
            >
              <div className="flex w-full min-w-0 items-center gap-2">
                <span className="text-base-content block min-w-0 flex-1 overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap md:text-sm">
                  {link.name}
                </span>
              </div>

              <div className="flex w-full items-center gap-2">
                <span className="text-[10px] text-gray-500">
                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                    {link.dateCreated}
                  </Moment>
                </span>

                <div
                  className="tooltip tooltip-secondary tooltip-top !z-50 flex-shrink-0"
                  data-tip={`Status: ${statusLabel}`}
                  tabIndex={0}
                >
                  <span
                    className={`inline-block size-2.5 rounded-full ${statusDotClasses}`}
                    aria-label={statusLabel}
                  />
                </div>
              </div>
            </button>
          </div>

          {/* Expand / Collapse */}
          <div
            className="tooltip tooltip-secondary tooltip-top !z-50 flex-shrink-0"
            data-tip={isExpanded ? "Collapse" : "Expand"}
            tabIndex={0}
          >
            <button
              type="button"
              onClick={toggleExpanded}
              className={`btn btn-ghost btn-sm btn-circle flex-shrink-0 ${
                isExpanded ? "btn-active" : ""
              }`}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              aria-expanded={isExpanded}
            >
              <IoChevronDownOutline
                className={`h-5 w-5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* PERFORMANCE INDICATORS  */}
        {performanceIndicatorItems.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:inline-grid sm:w-fit sm:grid-cols-4">
            {performanceIndicatorItems
              .slice(0, 4)
              .map(({ key, label, value, icon }) => (
                <div key={key} className="w-full sm:w-auto">
                  <div className="bg-base-200 text-base-content/80 flex w-full min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] sm:w-auto">
                    {icon}
                    <span className="shrink-0 text-sm font-semibold">
                      {value}
                    </span>
                    <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-base-300 animate-fade-in flex flex-col gap-4 border-t p-4">
          {/* <div className="flex flex-col gap-2">
            <div className="text-base-content/70 flex items-center gap-1.5 text-[11px] font-semibold md:text-xs">
              <IoStatsChartOutline className="h-4 w-4 opacity-70" />
              Link Performance
            </div>
            <ReferrerPerformanceOverview
              link={link}
              mode="small"
              showDescriptions={false}
            />
          </div> */}

          {/* <div className="flex flex-col gap-2">
            <div className="text-base-content/70 flex items-center gap-1.5 text-[11px] font-semibold md:text-xs">
              <IoPeopleOutline className="h-4 w-4 opacity-70" />
              Referral List
            </div>
            <ReferrerReferralsList linkId={link.id} />
          </div> */}

          <div className="flex w-full flex-col items-start gap-4 md:flex-row">
            <div className="w-full min-w-0 md:flex-1 md:basis-1/2">
              <ReferrerLinkDetails
                link={link}
                mode="small"
                className=""
                showQRCode={true}
                showShortLink={true}
                showCopyButton={true}
              />
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2 md:flex-1 md:basis-1/2">
              <div className="text-base-content/70 flex items-center gap-1.5 text-[11px] font-semibold md:text-xs">
                <IoShareSocialOutline className="h-4 w-4 opacity-70" />
                Share Link
              </div>
              <div className="text-base-content/60 text-[10px] md:text-[11px]">
                Share your link on your preferred platform
              </div>
              <ShareButtons
                url={link.shortURL ?? link.url}
                size={30}
                rewardAmount={program?.zltoRewardReferee}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
