import Image from "next/image";
import React from "react";

interface ReferralStatsSmallProps {
  linksCount: number;
  totalReferrals: number;
  completed: number;
  pending: number;
  zltoEarned: number;
}

export const ReferralStatsSmall: React.FC<ReferralStatsSmallProps> = ({
  linksCount,
  totalReferrals,
  completed,
  pending,
  zltoEarned,
}) => {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:gap-4">
      {/* Links Card */}
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

      {/* Performance Card */}
      <div className="flex flex-1 flex-col space-y-2">
        <div className="font-family-nunito font-semibold text-black">
          Overall Performance
        </div>
        <div className="flex flex-1 gap-2 rounded-md bg-white p-4">
          {/* Completed */}
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
              {(pending || 0).toLocaleString("en-US")}
            </div>
          </div>

          {/* Total */}
          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base-content/70 text-sm">Total</div>
            <div className="text-base-content flex">
              <span className="text-md mt-2 mr-1">👏</span>
              <span className="text-[26px] font-semibold">
                {(totalReferrals || 0).toLocaleString("en-US")}
              </span>
            </div>
            <div className="text-base-content flex items-center gap-2 text-[26px] font-semibold">
              {/* <Image
                src="/images/icon-referral-stats-total.svg"
                alt="Total"
                width={12}
                height={13}
                className="shrink-0"
              /> */}
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
