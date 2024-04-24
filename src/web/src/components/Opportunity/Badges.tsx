import Image from "next/image";
import {
  IoMdPerson,
  IoIosBook,
  IoMdPause,
  IoMdPlay,
  IoMdClose,
} from "react-icons/io";
import iconClock from "public/images/icon-clock.svg";
import iconZlto from "public/images/icon-zlto.svg";
import { useMemo } from "react";
import { OpportunityInfo } from "~/api/models/opportunity";

interface BadgesProps {
  opportunity: OpportunityInfo | undefined; // replace 'any' with the actual type
}

const Badges: React.FC<BadgesProps> = ({ opportunity }) => {
  // memo for spots left i.e participantLimit - participantCountTotal
  const spotsLeft = useMemo(() => {
    const participantLimit = opportunity?.participantLimit ?? 0;
    const participantCountTotal = opportunity?.participantCountTotal ?? 0;
    return Math.max(participantLimit - participantCountTotal, 0);
  }, [opportunity]);

  return (
    <div className="mb-2 mt-4 flex flex-row flex-wrap gap-1 text-xs font-bold text-green-dark md:my-2">
      {opportunity?.commitmentIntervalCount && (
        <div className="badge bg-green-light text-green">
          <Image
            src={iconClock}
            alt="Icon Clock"
            width={20}
            height={20}
            sizes="100vw"
            priority={true}
            style={{ width: "20px", height: "20px" }}
          />

          <span className="ml-1 text-xs">{`${
            opportunity.commitmentIntervalCount
          } ${opportunity.commitmentInterval}${
            opportunity.commitmentIntervalCount > 1 ? "s" : ""
          }`}</span>
        </div>
      )}
      {spotsLeft > 0 && (
        <div className="badge bg-blue-light text-blue">
          <IoMdPerson />

          <span className="ml-1 text-xs">{spotsLeft} Spots left</span>
        </div>
      )}
      {opportunity?.type && (
        <div className="badge bg-[#E7E8F5] text-[#5F65B9]">
          <IoIosBook />
          <span className="ml-1 text-xs">{opportunity.type}</span>
        </div>
      )}
      {(opportunity?.zltoReward ?? 0) > 0 && (
        <div className="badge bg-orange-light text-orange">
          <Image
            src={iconZlto}
            alt="Icon Zlto"
            width={16}
            height={16}
            sizes="100vw"
            priority={true}
            style={{ width: "16px", height: "16px" }}
          />
          <span className="ml-1 text-xs">{opportunity?.zltoReward}</span>
        </div>
      )}

      {/* STATUS BADGES */}
      {opportunity?.status == "Active" && (
        <>
          {new Date(opportunity.dateStart) > new Date() && (
            <div className="badge bg-yellow-tint text-yellow">
              <IoMdPause />
              <p className="ml-1">Not started</p>
            </div>
          )}
          {new Date(opportunity.dateStart) < new Date() && (
            <div className="badge bg-purple-tint text-purple-shade">
              <IoMdPlay />
              <span className="ml-1">Started</span>
            </div>
          )}
        </>
      )}
      {opportunity?.status == "Expired" && (
        <div className="badge bg-red-100 text-error">
          <IoMdClose className="h-4 w-4" />
          <span className="ml-1">Expired</span>
        </div>
      )}
    </div>
  );
};

export default Badges;
