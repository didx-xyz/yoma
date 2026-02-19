import Image from "next/image";
import React from "react";
import { type ReferralLink } from "~/api/models/referrals";

interface ReferralStatsSmallLinkProps {
  link: ReferralLink;
}

export const ReferralStatsSmallLink: React.FC<ReferralStatsSmallLinkProps> = ({
  link,
}) => {
  const stats = {
    totalExpired: link.expiredTotal || 0,
    completed: link.completionTotal || 0,
    pending: link.pendingTotal || 0,
    zltoEarned: Math.round(link.zltoRewardCumulative || 0),
    balance: link.completionBalance,
    limit: link.programCompletionLimitReferee,
  };

  const hasLimit = stats.balance !== null && stats.balance !== undefined;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Invites Card */}
      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">
          Referrals available
        </div>
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
          {link.status == "Active" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="text-base-content/70 text-sm">
                  Available codes left to refer
                </div>
              </div>
              <div className="text-base-content flex">
                {!hasLimit && <span className="mt-2 mr-1 text-sm">♾️</span>}
                {hasLimit && <span className="mt-2 mr-1 text-sm">❤️</span>}
                {hasLimit ? (
                  <div className="flex items-baseline">
                    <span className="text-[26px] font-semibold">
                      {stats.balance?.toLocaleString("en-US")}
                    </span>
                    {stats.limit && (
                      <span className="text-[26px] font-normal">
                        /{stats.limit.toLocaleString("en-US")}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[26px] font-semibold">Unlimited</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="text-base-content/70 text-sm">
                  This link is no longer available
                </div>
              </div>
              <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
                <Image
                  src="/images/icon-referral-stats-expired.svg"
                  alt="Expired"
                  width={17}
                  height={17}
                  className="shrink-0"
                />
                Unavailable
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performance Card */}
      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">
          Overall Performance
        </div>
        <div className="flex flex-1 gap-2 rounded-md bg-white p-4">
          {/* Completed */}
          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base-content/70 text-sm">Successful</div>
            <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
              <Image
                src="/images/icon-referral-stats-completed.svg"
                alt="Completed"
                width={16}
                height={11}
                className="shrink-0"
              />
              {(stats.completed || 0).toLocaleString("en-US")}
            </div>
          </div>

          {/* Pending */}
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
              {(stats.pending || 0).toLocaleString("en-US")}
            </div>
          </div>

          {/* Total */}
          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base-content/70 text-sm">Expired</div>
            <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
              <Image
                src="/images/icon-referral-stats-expired.svg"
                alt="Expired"
                width={13}
                height={13}
                className="shrink-0"
              />
              {(stats.totalExpired || 0).toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Card */}
      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">
          Rewards earned
        </div>

        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2">
            <div className="text-base-content/70 text-sm">Total</div>
          </div>

          <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
            <Image
              src="/images/icon-zlto-rounded-color.webp"
              alt="ZLTO"
              width={30}
              height={30}
              className="mr-2 h-auto"
            />
            {(stats.zltoEarned || 0).toLocaleString("en-US")}
          </div>
        </div>
      </div>
    </div>
  );
};
