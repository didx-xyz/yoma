import Image from "next/image";
import React, { useState } from "react";
import { IoChevronDownOutline } from "react-icons/io5";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import { FaShareAlt } from "react-icons/fa";

interface ReferrerLinkRowProps {
  link: ReferralLink;
  programs: ProgramInfo[];
  isExpanded?: boolean;
  onOpenShareModal?: (link: ReferralLink) => void;
}

export const ReferrerLinkRow: React.FC<ReferrerLinkRowProps> = ({
  link,
  programs,
  isExpanded: initialExpanded = false,
  onOpenShareModal,
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
        <Image
          src="/images/icon-referral-stats-total.svg"
          alt="Total"
          width={12}
          height={13}
          className="shrink-0"
        />
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
    <div className="py-4">
      {/* Header / Title Row */}
      <div className="select-none">
        <div className="flex min-w-0 items-center gap-3">
          {/* 1) Program name (with date + status) */}
          <div className="min-w-0 grow">
            <button
              type="button"
              onClick={toggleExpanded}
              className="font-family-nunito flex w-full min-w-0 grow flex-col items-start bg-transparent p-0 text-left"
              aria-expanded={isExpanded}
            >
              <div className="flex w-full min-w-0 items-center gap-2">
                <span className="text-base-content block min-w-0 flex-1 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap md:text-sm">
                  {link?.name ?? program?.name ?? "N/A"}
                </span>
              </div>

              <div className="flex w-full items-center gap-16 pt-1">
                <span className="text-base-content/70 text-sm">Status</span>
                <div className="flex items-center gap-2">
                  {link.status === "Active" ? (
                    <svg
                      width="16"
                      height="11"
                      viewBox="0 0 16 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                    >
                      <path
                        d="M4.8852 10.4731C5.18635 10.7742 5.62133 10.975 6.05631 10.975C6.4913 10.975 6.92628 10.8077 7.22742 10.4731L14.8229 2.87759C15.4921 2.20838 15.4921 1.17111 14.8229 0.501904C14.1537 -0.167301 13.1164 -0.167301 12.4472 0.501904L6.05631 6.92628L2.87758 3.74755C2.20838 3.07835 1.17111 3.07835 0.501904 3.74755C-0.167301 4.41676 -0.167301 5.45403 0.501904 6.12323L4.8852 10.4731Z"
                        fill="#387F6A"
                      />
                    </svg>
                  ) : link.status === "LimitReached" ? (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                    >
                      <path
                        d="M8.34277 0C12.9504 0 16.6854 3.73517 16.6855 8.34277C16.6855 12.9505 12.9505 16.6855 8.34277 16.6855C3.73517 16.6854 0 12.9504 0 8.34277C0.000115447 3.73524 3.73524 0.00011545 8.34277 0ZM8.34277 2C4.83981 2.00012 2.00012 4.83981 2 8.34277C2 11.8458 4.83974 14.6854 8.34277 14.6855C11.8459 14.6855 14.6855 11.8459 14.6855 8.34277C14.6854 4.83974 11.8458 2 8.34277 2ZM8.35547 2.27832C8.90761 2.27849 9.35547 2.72614 9.35547 3.27832V7.79395L13.1143 10.2227C13.5781 10.5224 13.7109 11.1416 13.4111 11.6055C13.1114 12.069 12.493 12.2018 12.0293 11.9023L7.35547 8.88281V3.27832C7.35547 2.72604 7.80318 2.27832 8.35547 2.27832Z"
                        fill="#F6B700"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="13"
                      viewBox="0 0 12 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                    >
                      <path
                        d="M9.42303 0.435059C9.99059 -0.145106 10.8593 -0.144872 11.4269 0.435059C11.991 1.01166 11.991 1.88873 11.4269 2.46533L7.9201 6.05029L11.4269 9.63525C11.991 10.2119 11.991 11.0879 11.4269 11.6646C11.1425 11.9553 10.7263 12.1001 10.425 12.1001C10.1237 12.1 9.70736 11.9552 9.42303 11.6646L5.92499 8.08936L2.42694 11.6646C2.29707 11.7973 2.15535 11.9096 1.98553 11.9868C1.81414 12.0647 1.6296 12.1001 1.42499 12.1001C1.22053 12.1001 1.0367 12.0646 0.865417 11.9868C0.695534 11.9096 0.55295 11.7974 0.423035 11.6646C-0.140597 11.088 -0.140764 10.2117 0.423035 9.63525L3.93085 6.05029L0.423035 2.46533C-0.141018 1.88874 -0.140991 1.01166 0.423035 0.435059C0.990588 -0.145106 1.85927 -0.144872 2.42694 0.435059L5.92499 4.01123L9.42303 0.435059ZM9.91132 0.435059H9.91229H9.91132Z"
                        fill={
                          link.status === "Cancelled" || !hasStatus
                            ? "#6B7280"
                            : "#FE4D57"
                        }
                      />
                    </svg>
                  )}
                  <span className="text-base-content/70 text-sm">
                    {statusLabel}
                  </span>
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
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-base-300 animate-fade-in pt-4x mt-4 flex flex-col gap-4 border-t">
          {/* PERFORMANCE INDICATORS  */}
          {performanceIndicatorItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {performanceIndicatorItems
                .slice(0, 4)
                .map(({ key, label, value, icon }) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 rounded-md bg-white px-3 py-2"
                  >
                    <div className="text-base-content/70 text-xs">{label}</div>
                    <div className="text-base-content flex items-center gap-2 text-lg font-semibold">
                      {icon}
                      {value}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* SHARE BUTTON */}
          <div className="flex w-full justify-center">
            <button
              type="button"
              className="btn btn-sm bg-orange gap-2 text-white hover:brightness-110"
              onClick={() => onOpenShareModal?.(link)}
            >
              <FaShareAlt className="h-3 w-3" />
              Share your link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
