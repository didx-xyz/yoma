import { useQuery } from "@tanstack/react-query";
import {
  ReferralLink,
  ReferralParticipationRole,
} from "~/api/models/referrals";
import { getMyReferralAnalytics } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import { LoadingInline } from "../Status/LoadingInline";
import Image from "next/image";

interface ReferralStatsSmallProps {
  linksCount: number;
  totalReferrals: number;
  completed: number;
  pending: number;
  zltoEarned: number;
}

const ReferralStatsSmall: React.FC<ReferralStatsSmallProps> = ({
  linksCount,
  totalReferrals,
  completed,
  pending,
  zltoEarned,
}) => {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:gap-4">
      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">Links</div>
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2">
            <div className="text-base-content/70 text-sm">Total Links</div>
          </div>
          <div className="text-base-content flex">
            <span className="mt-2 mr-1 text-sm">🔗</span>
            <span className="text-[26px] font-semibold">
              {linksCount.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">
          Overall Performance
        </div>
        <div className="flex flex-1 gap-2 rounded-md bg-white p-4">
          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base-content/70 text-sm">Completed</div>
            <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
              <Image
                src="/images/icon-referral-stats-completed.svg"
                alt="Completed"
                width={16}
                height={11}
                className="shrink-0"
              />
              {(completed || 0).toLocaleString("en-US")}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base-content/70 text-sm">Pending</div>
            <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
              <Image
                src="/images/icon-referral-stats-pending.svg"
                alt="Pending"
                width={17}
                height={17}
                className="shrink-0"
              />
              {(pending || 0).toLocaleString("en-US")}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base-content/70 text-sm">Total</div>
            <div className="text-base-content flex">
              <span className="text-md mt-2 mr-1">👏</span>
              <span className="text-[26px] font-semibold">
                {(totalReferrals || 0).toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">
          Rewards earned
        </div>

        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2">
            <div className="text-base-content/70 text-sm">
              Earned from referrals
            </div>
          </div>

          <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
            <Image
              src="/images/icon-zlto-rounded-color.webp"
              alt="ZLTO"
              width={30}
              height={30}
              className="mr-2 h-auto"
            />
            {(zltoEarned || 0).toLocaleString("en-US")}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReferrerStatsProps {
  link?: ReferralLink;
  linksCount?: number;
}

export const ReferrerStats: React.FC<ReferrerStatsProps> = ({
  link,
  linksCount,
}) => {
  const {
    data: analytics,
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: ["MyReferralAnalytics", ReferralParticipationRole.Referrer],
    queryFn: () => getMyReferralAnalytics(ReferralParticipationRole.Referrer),
    enabled: !link,
  });

  const rawStats = link
    ? {
        totalReferrals: link?.usageTotal || 0,
        completed: link?.completionTotal || 0,
        pending: link?.pendingTotal || 0,
        zltoEarned: link?.zltoRewardReferrerTotal || 0,
      }
    : {
        totalReferrals: analytics?.usageCountTotal || 0,
        completed: analytics?.usageCountCompleted || 0,
        pending: analytics?.usageCountPending || 0,
        zltoEarned: analytics?.zltoRewardTotal || 0,
      };

  const stats = rawStats;

  return (
    <Suspense
      isLoading={isLoading}
      error={error as any}
      loader={
        <div className="rounded-lg bg-white p-4">
          <LoadingInline classNameSpinner="h-12 border-orange w-12" label="" />
        </div>
      }
    >
      <ReferralStatsSmall
        linksCount={linksCount || 0}
        totalReferrals={stats.totalReferrals}
        completed={stats.completed}
        pending={stats.pending}
        zltoEarned={stats.zltoEarned}
      />
    </Suspense>
  );
};
