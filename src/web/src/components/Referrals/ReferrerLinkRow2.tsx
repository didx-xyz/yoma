import Image from "next/image";
import Link from "next/link";
import React from "react";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import { FaShareAlt } from "react-icons/fa";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";

interface ReferrerLinkRowProps {
  link: ReferralLink;
  programs: ProgramInfo[];
  isExpanded?: boolean;
  onOpenShareModal?: (link: ReferralLink) => void;
}

export const ReferrerLinkRow2: React.FC<ReferrerLinkRowProps> = ({
  link,
  programs,
  onOpenShareModal,
}) => {
  // Logic from ReferrerLinkCard
  const program = programs.find((p) => p.id === link.programId);

  const hasStatus = !!link.status;
  const statusLabel = hasStatus
    ? link.status === "LimitReached"
      ? "Limit Reached"
      : link.status
    : "—";

  const linkStats = {
    totalReferrals: link.usageTotal || 0,
    completed: link.completionTotal || 0,
    pending: link.pendingTotal || 0,
    zltoEarned: Math.round(link.zltoRewardCumulative || 0),
  };

  const performanceIndicatorItems = [
    {
      key: "completed",
      label: "Completed",
      value: linkStats.completed,
      icon: (
        <Image
          src="/images/icon-referral-stats-completed.svg"
          alt="Completed"
          width={16}
          height={11}
          className="shrink-0"
        />
      ),
    },
    {
      key: "pending",
      label: "Pending",
      value: linkStats.pending,
      icon: (
        <Image
          src="/images/icon-referral-stats-pending.svg"
          alt="Pending"
          width={17}
          height={17}
          className="shrink-0"
        />
      ),
    },
    {
      key: "totalReferrals",
      label: "Total",
      value: linkStats.totalReferrals,
      icon: (
        // <Image
        //   src="/images/icon-referral-stats-total.svg"
        //   alt="Total"
        //   width={12}
        //   height={13}
        //   className="shrink-0"
        // />

        <span className="text-md">👏</span>
      ),
    },
    {
      key: "zlto",
      label: "Rewards",
      value: linkStats.zltoEarned,
      icon: (
        <Image
          src="/images/icon-zlto-rounded-color.webp"
          alt="ZLTO"
          width={18}
          height={18}
          className="h-auto shrink-0"
        />
      ),
    },
  ];

  return (
    <div className="flex w-full items-center justify-between gap-3 py-4 select-none">
      <div className="flex max-w-full min-w-0 flex-1 flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
        {/* HEADER & PERFORMANCE */}
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/referrals/link/${link.id}`}
            className="font-family-nunito text-base-content block min-w-0 overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap transition-opacity hover:opacity-75 md:text-sm"
          >
            {program?.name ?? link?.name ?? "N/A"}
          </Link>
          {/* <div className="flex items-center gap-3 md:gap-4">
            {performanceIndicatorItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-1"
                title={item.label}
              >
                {item.icon}
                <span className="text-base-content/70 text-xs font-bold">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                </span>
              </div>
            ))}
          </div> */}
        </div>

        {/* DATE & STATUS */}
        <div className="flex shrink-0 flex-row items-start gap-2 md:items-center md:justify-center md:px-4">
          <span className="text-base-content/70 text-xs">
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {link.dateCreated}
            </Moment>
          </span>
          <div className="flex items-center gap-2">
            {link.status === "Active" ? (
              <Image
                src="/images/icon-referral-stats-completed.svg"
                alt="Active"
                width={14}
                height={14}
                className="shrink-0"
              />
            ) : link.status === "LimitReached" ? (
              <Image
                src="/images/icon-referral-stats-pending.svg"
                alt="Limit Reached"
                width={14}
                height={14}
                className="shrink-0"
              />
            ) : (
              <Image
                src="/images/icon-referral-stats-expired.svg"
                alt="Status"
                width={11}
                height={11}
                className="shrink-0"
              />
            )}
            <span className="text-base-content/70 text-xs font-bold">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="flex gap-2">
        {/* <Link
          className="btn tooltip tooltip-secondary tooltip-left md:tooltip-top btn-sm bg-orange btn-circle shrink-0 gap-2 p-0 px-1 text-white hover:brightness-110 md:w-auto md:rounded-lg md:px-4"
          href={`/referrals/link/${link.id}`}
          data-tip="View referral details and performance"
        >
          <FaChartBar className="h-3 w-3" />
          <span className="hidden md:block">View</span>
        </Link> */}

        <button
          type="button"
          onClick={() => onOpenShareModal?.(link)}
          className="btn btn-sm bg-orange btn-circle shrink-0 gap-2 p-0 px-1 text-white hover:brightness-110 md:w-auto md:rounded-lg md:px-4"
          disabled={link.status !== "Active"}
        >
          <FaShareAlt className="h-3 w-3" />
          <span className="hidden md:block">Share</span>
        </button>
      </div>
    </div>
  );
};
