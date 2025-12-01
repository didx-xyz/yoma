import { useRouter } from "next/router";
import { IoGift } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchReferralLinkUsagesAsReferrer } from "~/api/services/referrals";

interface ReferralCardProps {
  onClick?: () => void;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ onClick }) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  // Fetch referrer usage statistics
  const { data: usageResults } = useQuery({
    queryKey: ["ReferralLinkUsages", "Referrer", "Stats"],
    queryFn: () =>
      searchReferralLinkUsagesAsReferrer({
        pageNumber: 1,
        pageSize: 100, // Get all usages to calculate stats
        linkId: null,
        programId: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
      }),
  });

  const hasActiveLinks = (usageResults?.items?.length ?? 0) > 0;
  const totalReferrals = usageResults?.totalCount ?? 0;

  // Total earned would need program-level reward data which isn&apos;t in the usage response
  // For now, show count of completed referrals as the metric
  const completedReferrals =
    usageResults?.items?.filter((usage) => usage.status === "Completed")
      .length ?? 0;

  const handleGetStarted = () => {
    onClick?.();
    router.push("/yoid/referrals");
  };

  // Active referrer state with stats
  if (hasActiveLinks) {
    return (
      <div className="flex h-full flex-col gap-2 text-xs text-black md:text-sm">
        <div className="text-gray-dark flex items-start gap-2">
          <IoGift className="text-green mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Share & Earn Together</span>
            <span className="ml-1 text-xs">
              Track your referrals and rewards
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-y-2 border-dotted border-[#D4E8D4] py-2">
          <div className="flex flex-row items-center justify-between">
            <p className="text-gray-dark">Total Referrals:</p>
            <span className="badge bg-green-light text-green font-semibold">
              {totalReferrals}
            </span>
          </div>
          <div className="flex flex-row items-center justify-between">
            <p className="text-gray-dark">Completed:</p>
            <span className="badge bg-yellow-tint text-yellow font-semibold">
              {completedReferrals}
            </span>
          </div>
        </div>

        <button
          onClick={handleGetStarted}
          className="text-green hover:text-green-dark mt-auto flex w-full items-center justify-between text-xs font-semibold underline"
        >
          <span>View Dashboard</span>
          <FaArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Default state: Not started / No links created
  return (
    <div className="flex h-full flex-col gap-3 text-xs text-black md:text-sm">
      {/* Main Content Card */}
      <div className="overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 shadow-md">
        {/* Header */}
        <div className="border-b border-green-100 bg-gradient-to-r from-green-50 to-transparent p-4">
          <div className="items-centerx flex gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg">
              <IoGift className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">
                Share Yoma & <br />
                Earn Rewards!
              </h3>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Help friends discover opportunities and you&apos;ll both earn ZLTO.
            {"  "}
            {/* Toggle Details Button */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-green cursor-pointer text-xs underline"
            >
              {showDetails ? <>Hide details</> : <>See more...</>}
            </button>
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Expandable Details */}
          {showDetails && (
            <div className="animate-fade-in mb-4 space-y-3">
              <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3 shadow-sm">
                <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-blue-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    1
                  </span>
                  Get your link
                </h4>
                <p className="text-xs text-gray-600">
                  Choose from available programs and create personalized links
                </p>
              </div>

              <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-3 shadow-sm">
                <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-green-900">
                  <span className="bg-green flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                    2
                  </span>
                  Share it
                </h4>
                <p className="text-xs text-gray-600">
                  Spread the word through social media, messaging, or email
                </p>
              </div>

              <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-3 shadow-sm">
                <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold text-purple-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                    3
                  </span>
                  Earn together
                </h4>
                <p className="text-xs text-gray-600">
                  Both you and your referees receive rewards when they complete
                  tasks
                </p>
              </div>

              <div className="rounded-lg border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-xs font-semibold text-yellow-900">
                      Win-Win Benefits
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Help your network discover opportunities while earning
                      rewards. It&apos;s a win for everyone!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="btn btn-success w-full gap-2 rounded-lg normal-case shadow-md transition-all hover:scale-105 hover:shadow-lg"
          >
            <span className="font-semibold">Get Started</span>
            <FaArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
