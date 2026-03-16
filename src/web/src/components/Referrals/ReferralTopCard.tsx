import { type ReactNode } from "react";
import type { ProgramInfo } from "~/api/models/referrals";
import ProgramBadges from "~/components/Referrals/ProgramBadges";

interface ReferralTopCardProps {
  program: ProgramInfo;
  rewardsReferrer: boolean;
  rewardsReferee: boolean;
  cta?: ReactNode;
}

export const ReferralTopCard = ({
  program,
  rewardsReferrer,
  rewardsReferee,
  cta,
}: ReferralTopCardProps) => {
  return (
    <div className="mx-auto w-full rounded-2xl bg-white p-4 shadow md:p-6">
      <p className="font-family-nunito line-clamp-2 text-xl font-bold tracking-tight text-black md:line-clamp-1">
        {program.name}
      </p>
      <p className="text-gray-dark text-sm md:text-base">
        {program.description || "Referral programme"}
      </p>

      <ProgramBadges
        program={program}
        mode="compact"
        showBadges={{
          requirements: true,
          limit: false,
          rewards: true,
          rewardsReferrer,
          rewardsReferee,
        }}
        showPathway={program.pathwayRequired}
      />

      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  );
};
