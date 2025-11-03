import { useCallback, useState } from "react";
import {
  IoChevronDown,
  IoChevronUp,
  IoEye,
  IoPencil,
  IoShareSocial,
} from "react-icons/io5";
import type { ReferralLink, ProgramInfo } from "~/api/models/referrals";
import { LinkDetails } from "./LinkDetails";
import Image from "next/image";
import { FaLink } from "react-icons/fa";

interface LinkCardProps {
  link: ReferralLink;
  programs?: ProgramInfo[];
  onViewUsage?: (link: ReferralLink) => void;
  onEdit?: (link: ReferralLink) => void;
  onClick?: (link: ReferralLink) => void;
  className?: string;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  programs = [],
  onViewUsage,
  onEdit,
  onClick,
  className = "",
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Find the matching program
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

  const handleCardClick = useCallback(() => {
    onClick?.(link);
  }, [link, onClick]);

  // Determine if link can be edited based on status
  const canEdit = link.status === "Active";

  return (
    <div
      className={`group overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md transition-all hover:shadow-lg ${className}`}
    >
      {/* Header Section */}
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-transparent p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              className="mb-1 line-clamp-1 cursor-pointer items-center text-sm font-bold text-blue-900 transition-colors hover:text-blue-700"
              onClick={handleCardClick}
            >
              <FaLink className="mr-1 inline h-3 w-3 text-blue-600" />{" "}
              {link.name}
            </h3>
            {link.description && (
              <p className="mb-2 line-clamp-2 text-xs text-gray-600">
                {link.description}
              </p>
            )}

            {/* Program Info Section */}
            <div className="mt-2 rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-2">
              <div className="flex items-start gap-2">
                {/* Program Image */}
                {program?.imageURL && (
                  <Image
                    src={program.imageURL}
                    alt={program.name}
                    width={48}
                    height={48}
                    className="flex-shrink-0 rounded-lg object-cover shadow-sm"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-bold text-orange-900">
                    📋 {link.programName}
                  </p>
                  {program?.description && (
                    <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-600">
                      {program.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Stats Row */}
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="badge badge-sm bg-blue-100 text-blue-700">
            <span className="font-semibold">{link.pendingTotal || 0}</span>
            <span className="ml-1">pending</span>
          </div>
          <div className="badge badge-sm bg-green-100 text-green-700">
            <span className="font-semibold">{link.completionTotal || 0}</span>
            <span className="ml-1">completed</span>
          </div>
          {(link.zltoRewardCumulative || 0) > 0 && (
            <div className="badge badge-sm bg-yellow-100 text-yellow-700">
              <span className="font-semibold">{link.zltoRewardCumulative}</span>
              <span className="ml-1">ZLTO</span>
            </div>
          )}
          {link.expiredTotal !== null && link.expiredTotal > 0 && (
            <div className="badge badge-sm bg-orange-100 text-orange-700">
              <span className="font-semibold">{link.expiredTotal}</span>
              <span className="ml-1">expired</span>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleViewUsage}
            className="btn btn-sm flex-1 gap-1 border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          >
            <IoEye className="h-4 w-4" />
            <span className="text-xs">View</span>
          </button>
          <button
            onClick={handleEdit}
            className="btn btn-sm flex-1 gap-1 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white disabled:pointer-events-none disabled:opacity-50"
            disabled={!canEdit}
            title={!canEdit ? "Only active links can be edited" : ""}
            style={
              !canEdit
                ? { cursor: "not-allowed", pointerEvents: "auto" }
                : undefined
            }
          >
            <IoPencil className="h-4 w-4" />
            <span className="text-xs">Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="btn btn-sm gap-1 border-green-600 bg-green-600 text-white hover:bg-green-700"
          >
            {showDetails ? (
              <>
                <IoChevronUp className="h-4 w-4" />
                <span className="text-xs">Hide</span>
              </>
            ) : (
              <>
                <IoChevronDown className="h-4 w-4" />
                <span className="text-xs">Details</span>
              </>
            )}
          </button>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="animate-fade-in mt-3 space-y-3 border-t border-blue-100 pt-3">
            {/* Link Details */}
            <div>
              <LinkDetails
                link={link}
                mode="small"
                showQRCode={true}
                showShare={true}
                shareTitle="Check out this opportunity on Yoma!"
                shareDescription={`Join me on Yoma! ${program?.name ? `Complete the ${program.name} program` : "Complete programs"} and earn rewards together.`}
              />
            </div>

            {/* Date Info */}
            <div className="border-t border-blue-100 pt-2">
              <p className="text-xs text-gray-600">
                Created:{" "}
                {new Date(link.dateCreated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
