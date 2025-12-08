import { useState } from "react";
import {
  IoChevronDown,
  IoChevronUp,
  IoAdd,
  IoInformationCircleOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import ProgramBadges from "./ProgramBadges";
import { ProgramImage } from "./ProgramImage";
import { ProgramStatusBadge } from "./ProgramStatusBadge";

export interface ProgramDetailsProps {
  program: ProgramInfo;
  perspective: "referrer" | "referee";
  isExpanded?: boolean;
  showDetails?: boolean;
  // Referrer-specific props
  onClick?: () => void;
  onCreateLink?: () => void;
  selected?: boolean;
  className?: string;
  context?: "list" | "select" | "preview"; // list=Create Link, select=Select Program, preview=hide button
}

export const RefereeProgramDetails: React.FC<ProgramDetailsProps> = ({
  program,
  perspective,
  isExpanded = false,
  showDetails: showDetailsOption = true,
  onClick,
  onCreateLink,
  selected = false,
  className = "",
  context = "list",
}) => {
  const [showDetails, setShowDetails] = useState(isExpanded);

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <div
      className={`group overflow-hidden rounded-xl border-2 bg-gradient-to-br shadow-md transition-all hover:shadow-lg ${
        selected
          ? "border-orange-400 from-orange-100 to-white"
          : "border-orange-200 from-orange-50 to-white"
      } ${className}`}
    >
      {/* Header Section */}
      <div
        onClick={onClick}
        className={`border-b border-orange-100 bg-gradient-to-r from-orange-50 to-transparent px-4 py-2 ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Program Image or Placeholder Icon */}
          <div className="flex-shrink-0">
            <ProgramImage
              imageURL={program.imageURL}
              name={program.name}
              size={50}
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* Title with Status Badge */}
            <div className="mb-1 flex items-center gap-2">
              <h3
                className={`font-family-nunito line-clamp-1 flex-1 text-[16px] font-bold text-orange-900 ${onClick ? "hover:text-opacity-80 transition-colors" : ""}`}
              >
                {program.name}
              </h3>

              {/* Status Badge */}
              <ProgramStatusBadge status={program.status} />
            </div>

            {/* Description */}
            {program.description && (
              <p className="line-clamp-3 text-xs text-gray-600">
                {program.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Badges */}
        {showDetailsOption && <ProgramBadges program={program} />}

        {/* Action Buttons Row */}
        {showDetailsOption && (
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            {perspective === "referrer" && context !== "preview" && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (context === "select") {
                    onClick?.();
                  } else {
                    onCreateLink?.();
                  }
                }}
                disabled={program.status !== "Active"}
                className={`btn btn-sm gap-1 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
                  context === "select"
                    ? "border-orange-500 bg-gradient-to-r from-orange-500 to-yellow-500"
                    : "border-blue-600 bg-gradient-to-r from-blue-600 to-blue-500"
                }`}
              >
                {context === "select" ? (
                  <>
                    <IoAdd className="h-4 w-4" />
                    <span className="text-xs font-semibold">
                      Select Program
                    </span>
                  </>
                ) : (
                  <>
                    <IoAdd className="h-4 w-4" />
                    <span className="text-xs font-semibold">Create Link</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleDetails}
              className={`btn btn-sm gap-1 border-orange-300 bg-transparent text-orange-600 hover:bg-orange-100 ${
                perspective === "referee" || context === "preview"
                  ? "mx-auto"
                  : ""
              }`}
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
        )}

        {/* Expandable Details */}
        {showDetails && (
          <div className="animate-fade-in mt-3 space-y-3 border-t border-orange-100 pt-3">
            {/* DETAILS Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-orange-900">Details</h4>

              {/* Rewards - Always show, even if none */}
              <div className="space-y-2">
                {perspective === "referee" &&
                (program.zltoRewardReferee !== null ||
                  program.zltoRewardReferrer !== null) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {program.zltoRewardReferee !== null && (
                      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-2 shadow-sm">
                        <p className="text-xs font-medium text-green-700">
                          Your Reward 🎁
                        </p>
                        <p className="text-sm font-bold text-green-900">
                          {program.zltoRewardReferee.toLocaleString("en-US")}{" "}
                          ZLTO
                        </p>
                        <p className="text-[10px] text-gray-600">
                          When you complete
                        </p>
                      </div>
                    )}
                    {program.zltoRewardReferrer !== null && (
                      <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-2 shadow-sm">
                        <p className="text-xs font-medium text-blue-700">
                          Friend&apos;s Reward 🤝
                        </p>
                        <p className="text-sm font-bold text-blue-900">
                          {program.zltoRewardReferrer.toLocaleString("en-US")}{" "}
                          ZLTO
                        </p>
                        <p className="text-[10px] text-gray-600">
                          For who referred you
                        </p>
                      </div>
                    )}
                  </div>
                ) : perspective === "referrer" &&
                  (program.zltoRewardReferrer !== null ||
                    program.zltoRewardReferee !== null) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {program.zltoRewardReferrer !== null && (
                      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-2 shadow-sm">
                        <p className="text-xs font-medium text-green-700">
                          Your Reward 🎁
                        </p>
                        <p className="text-sm font-bold text-green-900">
                          {program.zltoRewardReferrer.toLocaleString("en-US")}{" "}
                          ZLTO
                        </p>
                        <p className="text-[10px] text-gray-600">
                          When friends complete
                        </p>
                      </div>
                    )}
                    {program.zltoRewardReferee !== null && (
                      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-2 shadow-sm">
                        <p className="text-xs font-medium text-green-700">
                          Friend&apos;s Reward 🎉
                        </p>
                        <p className="text-sm font-bold text-green-900">
                          {program.zltoRewardReferee.toLocaleString("en-US")}{" "}
                          ZLTO
                        </p>
                        <p className="text-[10px] text-gray-600">
                          They earn too!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-2">
                    <span className="badge badge-sm bg-pink-100 text-pink-700">
                      ℹ️ No ZLTO rewards
                    </span>
                    <p className="mt-1 text-[10px] text-gray-600">
                      This program doesn&apos;t offer ZLTO rewards
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div
                  className={`grid ${perspective === "referrer" ? "grid-cols-2" : "grid-cols-2"} gap-2`}
                >
                  {perspective === "referrer" && (
                    <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-2">
                      <p className="text-xs font-semibold text-orange-700">
                        Max Referrals
                      </p>
                      <p className="text-sm font-bold text-orange-900">
                        {program.completionLimitReferee === null ||
                        program.completionLimitReferee === 0
                          ? "Unlimited"
                          : program.completionLimitReferee.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {program.completionLimitReferee === null ||
                        program.completionLimitReferee === 0
                          ? "No limit on referrals"
                          : `You can refer up to ${program.completionLimitReferee} people`}
                      </p>
                    </div>
                  )}

                  {/* Completion Window */}
                  <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-2">
                    <p className="text-xs font-semibold text-orange-700">
                      {perspective === "referrer"
                        ? "Completion Window"
                        : "Time to Complete"}
                    </p>
                    <p className="text-sm font-bold text-orange-900">
                      {program.completionWindowInDays !== null
                        ? `${program.completionWindowInDays} days`
                        : "No limit"}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {program.completionWindowInDays !== null
                        ? perspective === "referrer"
                          ? `They have ${program.completionWindowInDays} days to complete the program`
                          : `Complete within ${program.completionWindowInDays} days after claiming`
                        : perspective === "referrer"
                          ? "No time restriction"
                          : "Take your time - no deadline!"}
                    </p>
                  </div>

                  {/* Start Date */}
                  <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-2">
                    <p className="text-xs font-semibold text-orange-700">
                      {perspective === "referrer"
                        ? "Start Date"
                        : "Program Start Date"}
                    </p>
                    <p className="text-sm font-bold text-orange-900">
                      {new Date(program.dateStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {perspective === "referrer"
                        ? "Program launched"
                        : "When it started"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* REQUIREMENTS Section */}
            <div className="space-y-2 border-t border-orange-100 pt-3">
              <h4 className="text-xs font-bold text-orange-900">
                {perspective === "referrer"
                  ? "Program Requirements"
                  : "What You Need to Do"}
              </h4>

              {program.proofOfPersonhoodRequired || program.pathwayRequired ? (
                <div className="space-y-1.5">
                  {program.proofOfPersonhoodRequired && (
                    <div className="flex flex-col items-start gap-2 rounded-lg md:flex-row md:items-center">
                      <span className="badge badge-sm flex-shrink-0 bg-blue-100 text-blue-700">
                        <IoCheckmarkCircle className="h-4 w-4" />
                        <span className="ml-1">Proof of Person</span>
                      </span>
                      <div className="flex items-start gap-1">
                        <IoInformationCircleOutline className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                        <p className="text-[10px] leading-relaxed text-gray-600">
                          {perspective === "referrer"
                            ? "Identity verification needed"
                            : "Verify you're a real person"}
                        </p>
                      </div>
                    </div>
                  )}
                  {program.pathwayRequired && (
                    <div className="flex flex-col items-start gap-2 rounded-lg md:flex-row md:items-center">
                      <span className="badge badge-sm flex-shrink-0 bg-blue-100 text-blue-700">
                        <IoCheckmarkCircle className="h-4 w-4" />
                        <span className="ml-1">Pathway Completion</span>
                      </span>
                      <div className="flex items-start gap-1">
                        <IoInformationCircleOutline className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                        <p className="text-[10px] leading-relaxed text-gray-600">
                          {perspective === "referrer"
                            ? "All pathway steps must be completed"
                            : "Complete all pathway activities"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-2">
                  <span className="badge badge-sm bg-pink-100 text-pink-700">
                    ℹ️ No special requirements
                  </span>
                  <p className="mt-1 text-[10px] text-gray-600">
                    {perspective === "referrer"
                      ? "Anyone can participate in this program"
                      : "Just claim the link to participate!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
