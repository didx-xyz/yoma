import { useRef, useState, useMemo } from "react";
import { IoChevronDown, IoChevronUp, IoWarning } from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";

interface RefereeImportantInfoProps {
  program: ProgramInfo;
  isExpanded?: boolean;
}

export const RefereeImportantInfo: React.FC<RefereeImportantInfoProps> = ({
  program,
  isExpanded: initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else {
      setIsExpanded(true);
    }
  };

  // Generate dynamic important points based on program configuration
  const importantPoints = useMemo(() => {
    const points = [];

    // New users only
    points.push({
      icon: "🚫",
      title: "New Users Only",
      description: program.proofOfPersonhoodRequired
        ? "This referral is for NEW users. If you're already a Yoma user, you're NOT eligible. New users must sign in with Google/Facebook or register with a phone number (South Africa only)."
        : "This referral is for NEW users only. If you already have a Yoma account, you're NOT eligible to claim this link.",
      color: "red",
    });

    // Time limit
    if (program.completionWindowInDays) {
      points.push({
        icon: "⏱️",
        title: `${program.completionWindowInDays}-Day Time Limit`,
        description: `Once claimed, you have ${program.completionWindowInDays} days to complete all requirements. Make sure you have time to commit before claiming!`,
        color: "yellow",
      });
    }

    // Pathway specific info
    if (program.pathwayRequired && program.pathway) {
      points.push({
        icon: "📚",
        title: "Pathway Completion Required",
        description:
          "You must complete all steps and tasks in the learning pathway. Some tasks may require uploading proof of completion and could be subject to review.",
        color: "green",
      });
    }

    // Rewards info
    if (program.zltoRewardReferee && program.zltoRewardReferee > 0) {
      points.push({
        icon: "🎁",
        title: "Earn ZLTO Rewards",
        description: `Complete all requirements to earn ${program.zltoRewardReferee} ZLTO tokens! Your friend who referred you will also earn rewards.`,
        color: "orange",
      });
    }

    // One claim per person
    points.push({
      icon: "⚠️",
      title: "One Claim Per Person",
      description:
        "You can only claim ONE referral link per program. Choose carefully and make sure you can complete the requirements!",
      color: "orange",
    });

    return points;
  }, [program]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; text: string }> =
      {
        red: {
          border: "border-red-200",
          bg: "bg-red-50",
          text: "text-red-900",
        },
        yellow: {
          border: "border-yellow-200",
          bg: "bg-yellow-50",
          text: "text-yellow-900",
        },
        green: {
          border: "border-green-200",
          bg: "bg-green-50",
          text: "text-green-900",
        },
        orange: {
          border: "border-orange-200",
          bg: "bg-orange-50",
          text: "text-orange-900",
        },
      };
    return colors[color] || colors.orange;
  };

  return (
    <div
      ref={containerRef}
      className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-lg"
    >
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-red-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 shadow-sm">
              <IoWarning className="h-5 w-5 text-red-600" />
            </div>
            Important Information
          </h2>
          <p className="text-sm text-gray-700">
            Please read these important requirements carefully before claiming
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="btn btn-sm gap-1 border-red-300 bg-transparent text-red-600 hover:bg-red-100"
        >
          {isExpanded ? (
            <>
              <IoChevronUp className="h-4 w-4" />
              <span className="text-xs">Hide</span>
            </>
          ) : (
            <>
              <IoChevronDown className="h-4 w-4" />
              <span className="text-xs">Show</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="animate-fade-in space-y-3">
          {importantPoints.map((point, index) => {
            const colorClasses = getColorClasses(point.color)!;
            return (
              <div
                key={index}
                className={`rounded-lg border-2 ${colorClasses.border} ${colorClasses.bg} p-4`}
              >
                <h6
                  className={`mb-2 flex items-center gap-2 font-bold ${colorClasses.text}`}
                >
                  <span className="text-lg">{point.icon}</span>
                  {point.title}
                </h6>
                <p className="text-sm text-gray-800">{point.description}</p>
              </div>
            );
          })}

          {/* Track Progress Reminder */}
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <h6 className="mb-2 flex items-center gap-2 font-bold text-blue-900">
              <span className="text-lg">📊</span>
              Track Your Progress
            </h6>
            <p className="text-sm text-gray-800">
              Once you claim this link, you can track your progress in real-time
              on your dashboard. You'll see exactly what steps remain and how
              close you are to completion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
