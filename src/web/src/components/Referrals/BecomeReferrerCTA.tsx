import Link from "next/link";
import { IoArrowForward, IoGift } from "react-icons/io5";

export const BecomeReferrerCTA: React.FC = () => {
  return (
    <div className="border-base-300 bg-base-100 rounded-xl border p-4 shadow-sm md:p-5">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-pink-50 md:h-12 md:w-12">
          <IoGift className="h-5 w-5 text-pink-700 md:h-6 md:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
            Become a referrer
          </h2>
          <p className="text-base-content/60 mt-1 line-clamp-2 text-[10px] leading-snug md:text-xs">
            Create referral links and earn rewards when friends complete
            programs.
          </p>

          <ul className="text-base-content/70 mt-3 ml-5 list-disc space-y-1 text-[10px] md:text-xs">
            <li>Create links for different programs</li>
            <li>Track claims and completions</li>
            <li>Earn ZLTO when they finish</li>
          </ul>

          <div className="mt-4">
            <Link
              href="/yoid/referrals"
              className="btn btn-sm inline-flex items-center gap-2 border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100"
            >
              <IoGift className="h-4 w-4" />
              Start referring
              <IoArrowForward className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
