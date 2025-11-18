import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import { IoMdCheckmarkCircle, IoMdPerson, IoMdTime } from "react-icons/io";
import { IoCheckmarkCircle, IoGift } from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";

interface ProgramBadgesProps {
  program: ProgramInfo | undefined;
  showToolTips?: boolean;
}

const ProgramBadges: React.FC<ProgramBadgesProps> = ({
  program,
  showToolTips = true,
}) => {
  if (!program) return null;

  return (
    <div className="text-orange-dark mt-3xxx md:my-2xx mb-2 space-y-1.5 text-xs font-bold">
      {/* First Row: Blue Badges (Time & Limits & Requirements) */}
      {(program.completionWindowInDays ||
        program.completionLimitReferee ||
        program.proofOfPersonhoodRequired ||
        program.pathwayRequired) && (
        <div className="flex flex-row flex-wrap gap-1">
          {/* Completion Window */}
          {program.completionWindowInDays && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && {
                "data-tip": "Time window to complete program",
              })}
            >
              <span className="badge badge-sm bg-blue-100 whitespace-nowrap text-blue-700">
                <IoMdTime className="h-4 w-4" />
                <span className="ml-1">
                  {program.completionWindowInDays} day
                  {program.completionWindowInDays > 1 ? "s" : ""} to complete
                </span>
              </span>
            </div>
          )}

          {/* Referrer Limit */}
          {program.completionLimitReferee && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "Maximum referrals allowed" })}
            >
              <span className="badge badge-sm bg-blue-100 whitespace-nowrap text-blue-700">
                <IoMdPerson className="h-4 w-4" />
                <span className="ml-1">
                  Max {program.completionLimitReferee} referral
                  {program.completionLimitReferee > 1 ? "s" : ""}
                </span>
              </span>
            </div>
          )}

          {/* Proof of Personhood Required */}
          {program.proofOfPersonhoodRequired && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && {
                "data-tip": "Identity verification required",
              })}
            >
              <span className="badge badge-sm bg-blue-100 whitespace-nowrap text-blue-700">
                <IoCheckmarkCircle className="h-4 w-4" />
                <span className="ml-1">Proof of Person</span>
              </span>
            </div>
          )}

          {/* Pathway Completion Required */}
          {program.pathwayRequired && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && {
                "data-tip": "All pathway steps must be completed",
              })}
            >
              <span className="badge badge-sm bg-blue-100 whitespace-nowrap text-blue-700">
                <IoCheckmarkCircle className="h-4 w-4" />
                <span className="ml-1">Pathway Completion</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Second Row: Pink Badges (No Rewards / No Requirements) */}
      {(!program.zltoRewardReferrer && !program.zltoRewardReferee) ||
      (!program.proofOfPersonhoodRequired &&
        !program.pathwayRequired &&
        !program.completionWindowInDays &&
        !program.completionLimitReferee) ? (
        <div className="flex flex-row flex-wrap gap-1">
          {/* No ZLTO rewards */}
          {!program.zltoRewardReferrer && !program.zltoRewardReferee && (
            <span className="badge badge-sm bg-pink-100 whitespace-nowrap text-pink-700">
              <IoGift className="h-4 w-4" />
              <span className="ml-1">No ZLTO rewards</span>
            </span>
          )}
          {/* No special requirements */}
          {!program.proofOfPersonhoodRequired &&
            !program.pathwayRequired &&
            !program.completionWindowInDays &&
            !program.completionLimitReferee && (
              <span className="badge badge-sm bg-pink-100 whitespace-nowrap text-pink-700">
                <IoMdCheckmarkCircle className="h-4 w-4" />
                <span className="ml-1">No special requirements</span>
              </span>
            )}
        </div>
      ) : null}

      {/* Third Row: Green Badges (Rewards) */}
      {(program.zltoRewardReferrer || program.zltoRewardReferee) && (
        <div className="flex flex-row flex-wrap gap-1">
          {/* Referrer Reward (You get) */}
          {program.zltoRewardReferrer && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && {
                "data-tip": "ZLTO reward for you (referrer)",
              })}
            >
              <span className="badge badge-sm bg-green-100 whitespace-nowrap text-green-700">
                <Image
                  src={iconZlto}
                  alt="ZLTO"
                  width={16}
                  height={16}
                  className="h-auto"
                />
                <span className="ml-1">
                  You get {program.zltoRewardReferrer} ZLTO
                </span>
              </span>
            </div>
          )}

          {/* Referee Reward (They get) */}
          {program.zltoRewardReferee && (
            <div
              className={`${showToolTips ? "tooltip tooltip-secondary cursor-help before:text-[0.6875rem]" : ""}`}
              {...(showToolTips && { "data-tip": "ZLTO reward for referee" })}
            >
              <span className="badge badge-sm bg-green-100 whitespace-nowrap text-green-700">
                <IoGift className="h-4 w-4" />
                <span className="ml-1">
                  They get {program.zltoRewardReferee} ZLTO
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramBadges;
