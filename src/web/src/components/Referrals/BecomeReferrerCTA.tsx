import Link from "next/link";
import { IoGift, IoArrowForward } from "react-icons/io5";

/**
 * BecomeReferrerCTA Component
 *
 * Displays an attractive call-to-action section inviting users to become referrers.
 * Shows benefits of creating referral links and earning rewards.
 *
 * @example
 * <BecomeReferrerCTA />
 */
export const BecomeReferrerCTA: React.FC = () => {
  return (
    <div className="rounded-xl border-4 border-green-300 bg-gradient-to-br from-green-50 to-white p-8 shadow-xl">
      <div className="mb-6 flex flex-col items-center gap-4 md:flex-row">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg">
          <IoGift className="h-10 w-10 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-lgx mb-2 font-bold text-green-900 md:text-xl">
            Want to Become a Referrer Instead?
          </h2>
          <p className="text-sm text-gray-700 md:text-base">
            Share Yoma with your friends and earn rewards together! Create your
            own referral links and start earning ZLTO.
          </p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 text-center shadow-sm">
          <div className="mb-2 flex justify-center">
            <span className="text-4xl">🔗</span>
          </div>
          <h3 className="mb-1 font-bold text-blue-900">Create Links</h3>
          <p className="text-xs text-gray-600">
            Get personalized referral links for different programs
          </p>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4 text-center shadow-sm">
          <div className="mb-2 flex justify-center">
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="mb-1 font-bold text-green-900">Track Progress</h3>
          <p className="text-xs text-gray-600">
            Monitor your referrals and see how much you've earned
          </p>
        </div>
        <div className="rounded-lg border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-4 text-center shadow-sm">
          <div className="mb-2 flex justify-center">
            <span className="text-4xl">💰</span>
          </div>
          <h3 className="mb-1 font-bold text-yellow-900">Earn ZLTO</h3>
          <p className="text-xs text-gray-600">
            Get rewarded when your friends complete programs
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Link
          href="/yoid/referrals"
          className="btn btn-success btn-lg gap-2 px-8 text-white shadow-lg hover:scale-105"
        >
          <IoGift className="h-5 w-5" />
          Start Referring & Earning
          <IoArrowForward className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};
