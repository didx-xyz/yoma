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
import Moment from "react-moment";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import ZltoRewardBadge from "./ZltoRewardBadge";

interface BadgesProps {
  opportunity: OpportunityInfo | undefined;
}

const PublicBadges: React.FC<BadgesProps> = ({ opportunity }) => {
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
        <div className="badge bg-green-light text-green">
          <Image
            src={iconClock}
            alt="Icon Clock"
            width={20}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />

          <span className="ml-1 text-xs">{`${
            opportunity.commitmentIntervalCount
          } ${opportunity.commitmentInterval}${
            opportunity.commitmentIntervalCount > 1 ? "s" : ""
          }`}</span>
        </div>
      )}

      {opportunity?.participantLimit != null && (
        <>
          {opportunity?.participantLimitReached && (
            <div className="badge bg-red-200 text-red-400">
              <IoMdWarning className="h-4 w-4" />

              <span className="ml-1 text-xs">Limit Reached</span>
            </div>
          )}

          {!opportunity?.participantLimitReached && (
            <div className="badge bg-blue-light text-blue">
              <IoMdPerson className="h-4 w-4" />

              <span className="ml-1 text-xs">{spotsLeft} Spots left</span>
            </div>
          )}
        </>
      )}

      {opportunity?.type && (
        <>
          {opportunity?.type === "Learning" && (
            <div className="badge bg-[#E7E8F5] text-[#5F65B9]">
              📚 {opportunity.type}
            </div>
          )}
          {opportunity?.type === "Micro-task" && (
            <div className="badge bg-yellow-tint text-yellow">
              ⚡ {opportunity.type}
            </div>
          )}
          {opportunity?.type === "Event" && (
            <div className="badge bg-[#E7E8F5] text-[#5F65B9]">
              🎉 {opportunity.type}
            </div>
          )}
          {opportunity?.type === "Other" && (
            <div className="badge bg-[#fda6d3] text-[#ad3f7c]">
              💡 {opportunity.type}
            </div>
          )}
        </>
      )}

      {opportunity?.engagementType && (
        <>
          {opportunity?.engagementType === "Hybrid" && (
            <div className="badge bg-[#E7E8F5] text-[#5F65B9]">
              🏠🌐 {opportunity.engagementType}
            </div>
          )}
          {opportunity?.engagementType === "Offline" && (
            <div className="badge bg-yellow-tint text-[#5F65B9]">
              🏠 {opportunity.engagementType}
            </div>
          )}
          {opportunity?.engagementType === "Online" && (
            <div className="badge bg-[#E7E8F5] text-[#5F65B9]">
              🌐 {opportunity.engagementType}
            </div>
          )}
        </>
      )}

      {opportunity && <ZltoRewardBadge amount={opportunity.zltoReward} />}

      {/* STATUS BADGES */}
      {opportunity?.status == "Active" && (
        <>
          {new Date(opportunity.dateStart) > new Date() && (
            <div className="badge bg-yellow-tint text-yellow">
              <IoMdCalendar className="h-4 w-4" />
              <Moment format={DATE_FORMAT_HUMAN} utc={true} className="ml-1">
                {opportunity.dateStart}
              </Moment>
            </div>
          )}
          {new Date(opportunity.dateStart) < new Date() && (
            <div className="badge bg-purple-tint text-purple-shade">
              <IoMdPlay />
              <span className="ml-1">Ongoing</span>
            </div>
          )}
        </>
      )}

      {opportunity?.status == "Expired" && (
        <>
          {opportunity.verificationEnabled &&
            opportunity.verificationMethod === "Manual" &&
            !opportunity?.participantLimitReached && (
              <div className="badge text-error bg-red-100">
                <IoMdCloudUpload className="h-4 w-4" />
                <span className="ml-1">Upload Only</span>
              </div>
            )}
          {(!opportunity.verificationEnabled ||
            opportunity.verificationMethod !== "Manual") && (
            <div className="badge text-error bg-red-100">
              <IoMdWarning className="h-4 w-4" />
              <span className="ml-1">Expired</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PublicBadges;
