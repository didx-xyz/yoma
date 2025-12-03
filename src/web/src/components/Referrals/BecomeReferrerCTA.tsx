import Link from "next/link";
import { IoGift, IoArrowForward } from "react-icons/io5";

export const BecomeReferrerCTA: React.FC = () => {
  return (
    <div className="rounded-xl border-4 border-green-300 bg-gradient-to-br from-green-50 to-white p-4 shadow-xl md:p-6">
      <div className="mb-6 flex flex-col items-center gap-4 md:flex-row">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg md:h-14 md:w-14">
          <IoGift className="h-6 w-6 text-white md:h-8 md:w-8" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-base font-bold text-green-900 md:text-lg">
            Become a Referrer Instead!
          </h2>
          <p className="text-xs text-gray-700 md:text-sm">
            Share Yoma with your friends and earn rewards together! Create your
            own referral links and start earning ZLTO.
          </p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 text-center shadow-sm">
          <div className="mb-2 flex justify-center">
            <span className="text-2xl md:text-4xl">🔗</span>
          </div>
          <h3 className="mb-1 text-sm font-bold text-blue-900 md:text-base">
            Create Links
          </h3>
          <p className="text-[10px] text-gray-600 md:text-xs">
            Get personalized referral links for different programs
          </p>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4 text-center shadow-sm">
          <div className="mb-2 flex justify-center">
            <span className="text-2xl md:text-4xl">📊</span>
          </div>
          <h3 className="mb-1 text-sm font-bold text-green-900 md:text-base">
            Track Progress
          </h3>
          <p className="text-[10px] text-gray-600 md:text-xs">
            Monitor your referrals and see how much you&apos;ve earned
          </p>
        </div>
        <div className="rounded-lg border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-4 text-center shadow-sm">
          <div className="mb-2 flex justify-center">
            <span className="text-2xl md:text-4xl">💰</span>
          </div>
          <h3 className="mb-1 text-sm font-bold text-yellow-900 md:text-base">
            Earn ZLTO
          </h3>
          <p className="text-[10px] text-gray-600 md:text-xs">
            Get rewarded when your friends complete programs
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Link
          href="/yoid/referrals"
          className="btn btn-success btn-sm md:btn-md w-full gap-2 px-8 text-white shadow-lg hover:scale-105 md:w-auto"
        >
          <IoGift className="h-4 w-4 md:h-5 md:w-5" />
          Start Referring
          <IoArrowForward className="h-4 w-4 md:h-5 md:w-5" />
        </Link>
      </div>
    </div>
  );
};
