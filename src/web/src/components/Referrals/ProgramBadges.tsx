import {
  IoCheckmarkCircle,
  IoPeople,
  IoTime,
  IoWalletOutline,
} from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";

interface ProgramBadgesProps {
  program: ProgramInfo | undefined;
  showToolTips?: boolean;
}

const ProgramBadges: React.FC<ProgramBadgesProps> = ({
  program,
  showToolTips = false,
}) => {
  if (!program) return null;

  const referrerReward = program.zltoRewardReferrer || 0;
  const refereeReward = program.zltoRewardReferee || 0;

  return (
    <div className="mt-3 mb-2 space-y-1.5">
      {/* First Row: Blue Badges (Time & Limits & Requirements) */}
      {(program.completionWindowInDays ||
        program.completionLimitReferee ||
        program.proofOfPersonhoodRequired ||
        program.pathwayRequired) && (
        <div className="flex flex-row flex-wrap gap-1">
          {/* Completion Window */}
          {program.completionWindowInDays && (
            <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
              <IoTime className="text-warning h-4 w-4 shrink-0 opacity-70" />
              <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                {program.completionWindowInDays} day
                {program.completionWindowInDays > 1 ? "s" : ""} to complete
              </span>
            </div>
          )}

          {/* Referrer Limit */}
          {program.completionLimitReferee && (
            <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
              <IoPeople className="h-4 w-4 shrink-0 text-blue-600 opacity-70" />
              <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                Max {program.completionLimitReferee} referral
                {program.completionLimitReferee > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Proof of Personhood Required */}
          {program.proofOfPersonhoodRequired && (
            <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
              <IoCheckmarkCircle className="text-success h-4 w-4 shrink-0 opacity-70" />
              <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                Proof of Person
              </span>
            </div>
          )}

          {/* Pathway Completion Required */}
          {program.pathwayRequired && (
            <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
              <IoCheckmarkCircle className="text-success h-4 w-4 shrink-0 opacity-70" />
              <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                Pathway Completion
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
            <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
              <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
              <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                No ZLTO rewards
              </span>
            </div>
          )}
          {/* No special requirements */}
          {!program.proofOfPersonhoodRequired &&
            !program.pathwayRequired &&
            !program.completionWindowInDays &&
            !program.completionLimitReferee && (
              <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
                <IoCheckmarkCircle className="text-success h-4 w-4 shrink-0 opacity-70" />
                <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
                  No special requirements
                </span>
              </div>
            )}
        </div>
      ) : null}

      {/* Rewards Row (always show) */}
      <div className="flex flex-row flex-wrap gap-1">
        <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
          <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
          <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
            You get {referrerReward} ZLTO
          </span>
        </div>

        <div className="bg-base-200 text-base-content/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]">
          <IoWalletOutline className="h-4 w-4 shrink-0 text-amber-600 opacity-70" />
          <span className="text-base-content/60 text-[10px] leading-snug md:text-xs">
            They get {refereeReward} ZLTO
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgramBadges;
