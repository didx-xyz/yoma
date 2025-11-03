import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import { useMemo } from "react";
import {
  IoMdCalendar,
  IoMdCloudUpload,
  IoMdPerson,
  IoMdPlay,
  IoMdWarning,
} from "react-icons/io";
import {
  IoBookOutline,
  IoFlashOutline,
  IoCalendarOutline,
  IoLaptopOutline,
  IoHomeOutline,
  IoGlobeOutline,
  IoBulbOutline,
} from "react-icons/io5";
import Moment from "react-moment";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import ZltoRewardBadge from "./ZltoRewardBadge";

interface BadgesProps {
  opportunity: OpportunityInfo | undefined;
  showToolTips?: boolean;
}

const PublicBadges: React.FC<BadgesProps> = ({
  opportunity,
  showToolTips = false,
}) => {
  // memo for spots left i.e participantLimit - participantCountTotal
  const spotsLeft = useMemo(() => {
    const participantLimit = opportunity?.participantLimit ?? 0;
    const participantCountCompleted =
      opportunity?.participantCountCompleted ?? 0;
    return Math.max(participantLimit - participantCountCompleted, 0);
  }, [opportunity]);

  return (
    <div className="text-green-dark mt-4 mb-2 flex flex-row flex-wrap gap-1 text-xs font-bold md:my-2">
      {opportunity?.commitmentIntervalCount && (
        <div
          className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
          {...(showToolTips && { "data-tip": "Time commitment required" })}
        >
          <span className="badge badge-sm border border-green-200 bg-green-50 whitespace-nowrap text-green-700">
            <Image
              src={iconClock}
              alt="Icon Clock"
              width={16}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
            <span className="ml-1">{`${
              opportunity.commitmentIntervalCount
            } ${opportunity.commitmentInterval}${
              opportunity.commitmentIntervalCount > 1 ? "s" : ""
            }`}</span>
          </span>
        </div>
      )}

      {opportunity?.participantLimit != null && (
        <>
          {opportunity?.participantLimitReached && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "No spots available" })}
            >
              <span className="badge badge-sm border border-red-200 bg-red-50 whitespace-nowrap text-red-600">
                <IoMdWarning className="h-4 w-4" />
                <span className="ml-1">Limit Reached</span>
              </span>
            </div>
          )}

          {!opportunity?.participantLimitReached && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Available spots remaining" })}
            >
              <span className="badge badge-sm border border-blue-200 bg-blue-50 whitespace-nowrap text-blue-600">
                <IoMdPerson className="h-4 w-4" />
                <span className="ml-1">{spotsLeft} Spots left</span>
              </span>
            </div>
          )}
        </>
      )}

      {opportunity?.type && (
        <>
          {opportunity?.type === "Learning" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Educational content" })}
            >
              <span className="badge badge-sm border border-blue-200 bg-blue-50 whitespace-nowrap text-blue-700">
                <IoBookOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.type}</span>
              </span>
            </div>
          )}
          {opportunity?.type === "Micro-task" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Quick task" })}
            >
              <span className="badge badge-sm border border-amber-200 bg-amber-50 whitespace-nowrap text-amber-700">
                <IoFlashOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.type}</span>
              </span>
            </div>
          )}
          {opportunity?.type === "Event" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Live event or activity" })}
            >
              <span className="badge badge-sm border border-purple-200 bg-purple-50 whitespace-nowrap text-purple-700">
                <IoCalendarOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.type}</span>
              </span>
            </div>
          )}
          {opportunity?.type === "Other" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Other opportunity type" })}
            >
              <span className="badge badge-sm border border-pink-200 bg-pink-50 whitespace-nowrap text-pink-700">
                <IoBulbOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.type}</span>
              </span>
            </div>
          )}
        </>
      )}

      {opportunity?.engagementType && (
        <>
          {opportunity?.engagementType === "Hybrid" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Online and in-person" })}
            >
              <span className="badge badge-sm border border-indigo-200 bg-indigo-50 whitespace-nowrap text-indigo-700">
                <IoLaptopOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.engagementType}</span>
              </span>
            </div>
          )}
          {opportunity?.engagementType === "Offline" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "In-person only" })}
            >
              <span className="badge badge-sm border border-orange-200 bg-orange-50 whitespace-nowrap text-orange-700">
                <IoHomeOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.engagementType}</span>
              </span>
            </div>
          )}
          {opportunity?.engagementType === "Online" && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Fully online" })}
            >
              <span className="badge badge-sm border border-teal-200 bg-teal-50 whitespace-nowrap text-teal-700">
                <IoGlobeOutline className="h-4 w-4" />
                <span className="ml-1">{opportunity.engagementType}</span>
              </span>
            </div>
          )}
        </>
      )}

      {opportunity && (
        <ZltoRewardBadge
          amount={opportunity.zltoReward}
          showToolTips={showToolTips}
        />
      )}

      {/* STATUS BADGES */}
      {opportunity?.status == "Active" && (
        <>
          {new Date(opportunity.dateStart) > new Date() && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Starts on this date" })}
            >
              <span className="badge badge-sm border border-yellow-200 bg-yellow-50 whitespace-nowrap text-yellow-700">
                <IoMdCalendar className="h-4 w-4" />
                <Moment format={DATE_FORMAT_HUMAN} utc={true} className="ml-1">
                  {opportunity.dateStart}
                </Moment>
              </span>
            </div>
          )}
          {new Date(opportunity.dateStart) < new Date() && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Currently active" })}
            >
              <span className="badge badge-sm border border-purple-200 bg-purple-50 whitespace-nowrap text-purple-700">
                <IoMdPlay className="h-4 w-4" />
                <span className="ml-1">Ongoing</span>
              </span>
            </div>
          )}
        </>
      )}

      {opportunity?.status == "Expired" && (
        <>
          {opportunity.verificationEnabled &&
            opportunity.verificationMethod === "Manual" &&
            !opportunity?.participantLimitReached && (
              <div
                className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
                {...(showToolTips && { "data-tip": "Can upload verification" })}
              >
                <span className="badge badge-sm border border-red-200 bg-red-50 whitespace-nowrap text-red-600">
                  <IoMdCloudUpload className="h-4 w-4" />
                  <span className="ml-1">Upload Only</span>
                </span>
              </div>
            )}
          {(!opportunity.verificationEnabled ||
            opportunity.verificationMethod !== "Manual") && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && {
                "data-tip": "No longer accepting participants",
              })}
            >
              <span className="badge badge-sm border border-red-200 bg-red-50 whitespace-nowrap text-red-600">
                <IoMdWarning className="h-4 w-4" />
                <span className="ml-1">Expired</span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PublicBadges;
