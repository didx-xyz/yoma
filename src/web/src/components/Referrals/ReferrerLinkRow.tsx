import React, { useState, useCallback } from "react";
import { FaLink } from "react-icons/fa";
import { IoChevronDown, IoChevronUp, IoEye, IoPencil } from "react-icons/io5";
import Moment from "react-moment";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { ReferrerLinkDetails } from "./ReferrerLinkDetails";
import { ReferrerPerformanceOverview } from "./ReferrerPerformanceOverview";
import { ShareButtons } from "./ShareButtons";

interface ReferrerLinkRowProps {
  link: ReferralLink;
  programs: ProgramInfo[];
  onViewUsage?: (link: ReferralLink) => void;
  onEdit?: (link: ReferralLink) => void;
  isExpanded?: boolean;
}

export const ReferrerLinkRow: React.FC<ReferrerLinkRowProps> = ({
  link,
  programs,
  onViewUsage,
  onEdit,
  isExpanded: initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Logic from ReferrerLinkCard
  const program = programs.find((p) => p.id === link.programId);

  const handleViewUsage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewUsage?.(link);
    },
    [link, onViewUsage],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.(link);
    },
    [link, onEdit],
  );

  const canEdit = link.status === "Active";

  return (
    <div className="border-base-300 bg-base-100 overflow-hidden rounded-lg border">
      {/* Header / Title Row */}
      <div
        className="flex min-w-0 cursor-pointer items-center gap-2 p-4 select-none hover:bg-gray-50"
        onClick={toggleExpand}
      >
        <div className="font-family-nunito flex min-w-0 grow items-center gap-2 text-xs font-semibold text-black md:text-sm">
          <FaLink className="h-3 w-3 flex-shrink-0 text-blue-600" />
          <span className="truncate">{link.name}</span>
        </div>

        <div className="text-gray hidden text-xs text-nowrap md:block md:text-sm">
          <Moment format={DATE_FORMAT_HUMAN} utc={true}>
            {link.dateCreated}
          </Moment>
        </div>

        <span
          className={`badge badge-sm flex-shrink-0 text-xs ${
            link.status === "Active"
              ? "bg-green-100 text-green-700"
              : link.status === "Cancelled"
                ? "bg-gray-200 text-gray-700"
                : link.status === "LimitReached"
                  ? "bg-orange-100 text-orange-700"
                  : link.status === "Expired"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-200 text-gray-700"
          }`}
        >
          {link.status === "LimitReached" ? "Limit Reached" : link.status}
        </span>

        <div className="ml-2 flex-shrink-0 text-gray-400">
          {isExpanded ? (
            <IoChevronUp className="h-4 w-4" />
          ) : (
            <IoChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-base-300 animate-fade-in flex flex-col gap-3 border-t p-4">
          <div className="flex grow flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-1">
              <ReferrerLinkDetails
                link={link}
                mode="small"
                className=""
                showQRCode={true}
                hideLabels={true}
              />
            </div>

            {/* Share Buttons */}
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-[10px] text-gray-600">
                Share your link on your preferred platform
              </p>

              <ShareButtons
                url={link.shortURL ?? link.url}
                size={30}
                rewardAmount={program?.zltoRewardReferee}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="mb-2 text-[10px] text-gray-600">Link Performance</p>
            <ReferrerPerformanceOverview link={link} mode="small" />
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-row gap-2 border-t border-gray-200 pt-3">
            <button
              onClick={handleViewUsage}
              className="btn btn-xs grow gap-1 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 md:grow-0"
            >
              <IoEye className="h-3 w-3" />
              <span className="text-[10px]">Link Performance</span>
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-xs grow gap-1 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white disabled:pointer-events-none disabled:opacity-50 md:grow-0"
              disabled={!canEdit}
              title={!canEdit ? "Only active links can be edited" : ""}
              style={
                !canEdit
                  ? { cursor: "not-allowed", pointerEvents: "auto" }
                  : undefined
              }
            >
              <IoPencil className="h-3 w-3" />
              <span className="text-[10px]">Edit Link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
