import { IoCheckmarkCircleOutline } from "react-icons/io5";

interface ReferralProgressCardProps {
  rewardAmount: number;
}

export const ReferralProgressSuccessCard = ({
  rewardAmount,
}: ReferralProgressCardProps) => {
  return (
    <div className="bg-purple-dark rounded-lg p-4 text-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white/15 p-2 text-white">
          <IoCheckmarkCircleOutline className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">Programme completed</p>
          <p className="mt-2 text-sm leading-6 text-white md:text-[15px]">
            Well done! You have completed the programme
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
