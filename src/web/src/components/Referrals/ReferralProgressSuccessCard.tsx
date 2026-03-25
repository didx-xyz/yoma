import { IoCheckmarkCircleOutline } from "react-icons/io5";
import Moment from "react-moment";
import { ReferralLinkUsageInfo } from "~/api/models/referrals";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";

export const ReferralProgressSuccessCard: React.FC<{
  usage: ReferralLinkUsageInfo;
}> = ({ usage }) => {
  const rewardAmount = usage?.zltoRewardReferee || 0;

  return (
    <div className="bg-purple-dark rounded-lg p-4 text-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white/15 p-2 text-white">
          <IoCheckmarkCircleOutline className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">Programme completed</p>
          <p className="mt-2 text-sm leading-6 text-white md:text-[15px]">
            Well done! You completed the programme{" "}
            {usage.dateCompleted && (
              <>
                {" "}
                on{" "}
                <Moment
                  format={DATE_FORMAT_HUMAN}
                  utc={true}
                  className="font-bold"
                >
                  {usage.dateCompleted}
                </Moment>
              </>
            )}
            {(rewardAmount > 0 && (
              <>
                {" "}
                and received <strong>{rewardAmount} Zlto</strong> in your
                wallet.
              </>
            )) ||
              "."}
          </p>
        </div>
      </div>
    </div>
  );
};
