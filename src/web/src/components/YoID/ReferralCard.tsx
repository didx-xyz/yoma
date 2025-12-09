import { useRouter } from "next/router";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { IoGift } from "react-icons/io5";

interface ReferralCardProps {
  onClick?: () => void;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ onClick }) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const handleGetStarted = () => {
    onClick?.();
    router.push("/yoid/referrals");
  };

  // Default state: Not started / No links created
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-white p-4 shadow">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full shadow-lg">
            <IoGift className="text-green h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">
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
      {/* Expandable Details */}
      {showDetails && (
        <div className="animate-fade-in mb-4 space-y-3">
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-black">
              <span className="bg-green flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                1
              </span>
              Get your link
            </h4>
            <p className="text-xs text-gray-600">
              Choose from available programs and create personalized links
            </p>
          </div>

          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-black">
              <span className="bg-green flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                2
              </span>
              Share it
            </h4>
            <p className="text-xs text-gray-600">
              Spread the word through social media, messaging, or email
            </p>
          </div>

          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-black">
              <span className="bg-green flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                3
              </span>
              Earn together
            </h4>
            <p className="text-xs text-gray-600">
              Both you and your referees receive rewards when they complete
              tasks
            </p>
          </div>
        </div>
      )}

      {/* Get Started Button */}
      <button
        onClick={handleGetStarted}
        className="btn btn-sm btn-success w-full gap-2 rounded-lg normal-case shadow-md transition-all hover:scale-105 hover:shadow-lg"
      >
        <span className="font-semibold">Get Started</span>
        <FaArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};
