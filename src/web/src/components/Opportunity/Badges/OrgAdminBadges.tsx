import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import { IoMdEyeOff, IoMdPause, IoMdPerson, IoMdPlay } from "react-icons/io";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconZlto from "public/images/icon-zlto.svg";

interface BadgesProps {
  opportunity: OpportunityInfo | undefined;
  isAdmin: boolean;
}

const OrgAdminBadges: React.FC<BadgesProps> = ({ opportunity, isAdmin }) => {
  return (
    <div className="flex flex-row flex-wrap gap-2 border-none font-bold text-green-dark">
      <div className="badge rounded-md border-none bg-green-light text-xs text-green">
        <Image
          src={iconClock}
          alt="Icon Clock"
          width={20}
          className="h-auto"
          sizes="100vw"
          priority={true}
        />

        <span className="ml-1 text-xs">{`${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}${
          opportunity?.commitmentIntervalCount ?? 0 > 1 ? "s" : ""
        }`}</span>
      </div>

      <div className="badge border-none bg-blue-light text-xs text-blue">
        <IoMdPerson className="h-4 w-4" />

        <span className="ml-1">
          {opportunity?.participantCountCompleted} enrolled
        </span>
      </div>

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

      {(opportunity?.zltoReward ?? 0) > 0 && (
        <div className="badge whitespace-nowrap border-none bg-orange-light text-orange">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={16}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
          <span className="ml-1 text-xs">{opportunity?.zltoReward}</span>
        </div>
      )}

      {/* STATUS BADGES */}
      {opportunity?.status == "Active" && (
        <>
          <div className="badge bg-blue-light text-blue">Active</div>

          {new Date(opportunity.dateStart) > new Date() && (
            <div className="badge bg-yellow-tint text-yellow">
              <IoMdPause />
              <p className="ml-1">Not started</p>
            </div>
          )}
          {new Date(opportunity.dateStart) < new Date() && (
            <div className="badge bg-purple-tint text-purple">
              <IoMdPlay />
              <span className="ml-1 text-xs">Started</span>
            </div>
          )}
        </>
      )}
      {opportunity?.status == "Expired" && (
        <div className="badge bg-green-light text-yellow">Expired</div>
      )}
      {opportunity?.status == "Inactive" && (
        <div className="badge bg-yellow-tint text-yellow">Inactive</div>
      )}
      {opportunity?.status == "Deleted" && (
        <div className="badge bg-green-light text-red-400">Deleted</div>
      )}

      {opportunity?.hidden && (
        <div className="badge bg-red-400 text-red-800">
          <IoMdEyeOff />
          <span className="ml-1 text-xs">Hidden</span>
        </div>
      )}

      {/* ADMINS CAN SEE THE FEATURED FLAG */}
      {isAdmin && opportunity?.featured && (
        <div className="badge bg-blue-light text-blue">Featured</div>
      )}
    </div>
  );
};

export default OrgAdminBadges;
