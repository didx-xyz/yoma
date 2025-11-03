import Image from "next/image";
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

interface ProgramCardProps {
  program: ProgramInfo;
  onClick?: () => void;
  onCreateLink?: () => void;
  selected?: boolean;
  className?: string;
  // Context for button behavior
  context?: "list" | "select" | "preview"; // list=Create Link, select=Select Program, preview=hide button
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onClick,
  onCreateLink,
  selected = false,
  className = "",
  context = "list",
}) => {
  const [showDetails, setShowDetails] = useState(false);

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
          <div className="min-w-0 flex-1">
            {/* Pathway Name */}
            {program.pathway && (
              <p className="mb-1 text-xs font-medium text-orange-700">
                🎯 {program.pathway.name}
              </p>
            )}

            {/* Title */}
            <h3 className="mb-1 line-clamp-1 text-sm font-bold text-orange-900 transition-colors hover:text-orange-700">
              {program.name}
            </h3>

            {/* Description */}
            {program.description && (
              <p className="line-clamp-3 text-xs text-gray-600">
                {program.description}
              </p>
            )}
          </div>

          {/* Program Image - Compact size */}
          {program.imageURL && (
            <div className="flex-shrink-0">
              <Image
                src={program.imageURL}
                alt={program.name}
                width={60}
                height={60}
                className="rounded-lg object-cover shadow-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Badges */}
        <ProgramBadges program={program} />

        {/* Action Buttons Row */}
        <div className="mt-3 flex gap-2">
          {context !== "preview" && (
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
              className={`btn btn-sm gap-1 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg ${
                context === "select"
                  ? "border-orange-500 bg-gradient-to-r from-orange-500 to-yellow-500"
                  : "border-blue-600 bg-gradient-to-r from-blue-600 to-blue-500"
              }`}
              style={context === "list" ? { maxWidth: "50%" } : undefined}
            >
              {context === "select" ? (
                <>
                  <IoAdd className="h-4 w-4" />
                  <span className="text-xs font-semibold">Select Program</span>
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
              context === "preview" ? "mx-auto" : ""
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

        {/* Expandable Details */}
        {showDetails && (
          <div className="animate-fade-in mt-3 space-y-3 border-t border-orange-100 pt-3">
            {/* DETAILS Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-orange-900">Details</h4>

              {/* Rewards - Always show, even if none */}
              <div className="space-y-2">
                {program.zltoRewardReferrer !== null ||
                program.zltoRewardReferee !== null ? (
                  <div className="grid grid-cols-2 gap-2">
                    {program.zltoRewardReferrer !== null && (
                      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-2 shadow-sm">
                        <p className="text-xs font-medium text-green-700">
                          Your Reward 🎁
                        </p>
                        <p className="text-sm font-bold text-green-900">
                          {program.zltoRewardReferrer.toLocaleString()} ZLTO
                        </p>
                        <p className="text-[10px] text-gray-600">
                          When friends complete
                        </p>
                      </div>
                    )}
                    {program.zltoRewardReferee !== null && (
                      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-2 shadow-sm">
                        <p className="text-xs font-medium text-green-700">
                          Friend's Reward 🎉
                        </p>
                        <p className="text-sm font-bold text-green-900">
                          {program.zltoRewardReferee.toLocaleString()} ZLTO
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
                      This program doesn't offer ZLTO rewards
                    </p>
                  </div>
                )}
              </div>

              {/* Limits & Window - Always show, even if none */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Max Referrals */}
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
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
                        : `You can refer up to ${program.completionLimitReferee}`}{" "}
                      people
                    </p>
                  </div>

                  {/* Completion Window */}
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                    <p className="text-xs font-semibold text-orange-700">
                      Completion Window
                    </p>
                    <p className="text-sm font-bold text-orange-900">
                      {program.completionWindowInDays !== null
                        ? `${program.completionWindowInDays} days`
                        : "No limit"}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {program.completionWindowInDays !== null
                        ? `They have ${program.completionWindowInDays} days to complete the program`
                        : "No time restriction"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Date */}
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-[10px] font-semibold text-gray-700">
                  Start Date
                </p>
                <p className="text-xs text-gray-900">
                  {new Date(program.dateStart).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* REQUIREMENTS Section */}
            <div className="space-y-2 border-t border-orange-100 pt-3">
              <h4 className="text-xs font-bold text-orange-900">
                Program Requirements
              </h4>

              {program.proofOfPersonhoodRequired || program.pathwayRequired ? (
                <div className="space-y-1.5">
                  {program.proofOfPersonhoodRequired && (
                    <div className="flex items-center gap-2 rounded-lg">
                      <span className="badge badge-sm flex-shrink-0 bg-blue-100 text-blue-700">
                        <IoCheckmarkCircle className="h-4 w-4" />
                        <span className="ml-1">Proof of Person Required</span>
                      </span>
                      <div className="flex items-start gap-1">
                        <IoInformationCircleOutline className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                        <p className="text-[10px] leading-relaxed text-gray-600">
                          Identity verification needed
                        </p>
                      </div>
                    </div>
                  )}
                  {program.pathwayRequired && (
                    <div className="flex items-center gap-2 rounded-lg">
                      <span className="badge badge-sm flex-shrink-0 bg-blue-100 text-blue-700">
                        <IoCheckmarkCircle className="h-4 w-4" />
                        <span className="ml-1">
                          Pathway Completion Required
                        </span>
                      </span>
                      <div className="flex items-start gap-1">
                        <IoInformationCircleOutline className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                        <p className="text-[10px] leading-relaxed text-gray-600">
                          All pathway steps must be completed
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
                    Anyone can participate in this program
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
