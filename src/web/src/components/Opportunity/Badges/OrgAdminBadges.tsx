import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import { IoMdPause, IoMdPerson, IoMdPlay } from "react-icons/io";
import type { OpportunityInfo } from "~/api/models/opportunity";
import iconZlto from "public/images/icon-zlto.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface BadgesProps {
  opportunity: OpportunityInfo | undefined;
  isAdmin: boolean;
}

const OrgAdminBadges: React.FC<BadgesProps> = ({ opportunity, isAdmin }) => {
  return (
    <div className="text-green-dark flex flex-row flex-wrap gap-2 border-none font-bold">
      <div className="badge bg-green-light text-green rounded-md border-none text-xs">
        <Image
          src={iconClock}
          alt="Icon Clock"
          width={20}
          className="h-auto"
          sizes="100vw"
          priority={true}
        />

        <span className="ml-1 text-xs">{`${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}${
          (opportunity?.commitmentIntervalCount ?? 0 > 1) ? "s" : ""
        }`}</span>
      </div>

      <div className="badge bg-blue-light text-blue border-none text-xs">
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
        <div className="badge bg-orange-light text-orange border-none whitespace-nowrap">
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
          <div className="badge bg-green-light text-green">Active</div>

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

      <div className="flex justify-between">
        <div className="flex w-20 justify-start gap-2">
          {opportunity?.hidden ? (
            <span className="badge bg-yellow-tint text-yellow">
              <FaEyeSlash className="mr-1 text-sm" />
              Hidden
            </span>
          ) : (
            <span className="badge bg-green-light text-green">
              <FaEye className="mr-1 text-sm" />
              Visible
            </span>
          )}
        </div>
      </div>

      {/* ADMINS CAN SEE THE FEATURED FLAG */}
      {isAdmin && opportunity?.featured && (
        <div className="badge bg-blue-light text-blue">Featured</div>
      )}
    </div>
  );
};

export default OrgAdminBadges;
