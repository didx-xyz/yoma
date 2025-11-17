import { useRef, useState, useMemo } from "react";
import {
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoClipboardOutline,
  IoPersonCircle,
  IoShieldCheckmark,
  IoPersonAdd,
} from "react-icons/io5";
import { FaRoad } from "react-icons/fa";
import type { ProgramInfo } from "~/api/models/referrals";
import { ProgramPathwayView } from "./ProgramPathwayView";

interface RefereeRequirementsProps {
  program: ProgramInfo;
  isExpanded?: boolean;
}

interface Requirement {
  icon: any;
  title: string;
  description: string;
  color: {
    border: string;
    bg: string;
    bgGradient: string;
    badge: string;
  };
}

export const RefereeRequirements: React.FC<RefereeRequirementsProps> = ({
  program,
  isExpanded: initialExpanded = true,
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

  // Generate dynamic requirements based on program configuration
  const requirements = useMemo<Requirement[]>(() => {
    const reqs: Requirement[] = [];

    // Always show registration requirement
    if (program.proofOfPersonhoodRequired) {
      reqs.push({
        icon: IoShieldCheckmark,
        title: "Register & Verify Identity",
        description:
          "Sign in with Google/Facebook or register with your phone number (South Africa only) to verify you're a real person.",
        color: {
          border: "border-blue-200",
          bg: "bg-blue-600",
          bgGradient: "from-blue-50 to-white",
          badge: "bg-blue-600",
        },
      });
    } else {
      reqs.push({
        icon: IoPersonAdd,
        title: "Register Account",
        description: "Create your Yoma account to get started.",
        color: {
          border: "border-blue-200",
          bg: "bg-blue-600",
          bgGradient: "from-blue-50 to-white",
          badge: "bg-blue-600",
        },
      });
    }

    // Always show profile completion requirement
    reqs.push({
      icon: IoPersonCircle,
      title: "Complete Your Profile",
      description:
        "Fill in your personal information, settings, and optionally add a profile photo.",
      color: {
        border: "border-purple-200",
        bg: "bg-purple-600",
        bgGradient: "from-purple-50 to-white",
        badge: "bg-purple-600",
      },
    });

    // Conditionally add pathway requirement
    if (program.pathwayRequired && program.pathway) {
      reqs.push({
        icon: FaRoad,
        title: "Complete Pathway",
        description:
          "Finish all required steps and tasks in the learning pathway.",
        color: {
          border: "border-green-200",
          bg: "bg-green",
          bgGradient: "from-green-50 to-white",
          badge: "bg-green",
        },
      });
    }

    return reqs;
  }, [program]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg"
    >
      {/* Header with Toggle */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-orange-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 shadow-sm">
              <IoClipboardOutline className="h-5 w-5 text-orange-600" />
            </div>
            What you need to do
          </h2>
          <p className="text-sm text-gray-700">
            {requirements.length} step{requirements.length > 1 ? "s" : ""} to
            complete this program
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="btn btn-sm gap-1 border-orange-300 bg-transparent text-orange-600 hover:bg-orange-100"
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
          {requirements.map((req, index) => {
            const Icon = req.icon;
            return (
              <div
                key={index}
                className={`group rounded-lg border-2 ${req.color.border} bg-gradient-to-br ${req.color.bgGradient} p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${req.color.badge} shadow-md`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="mb-1 font-bold text-gray-900">
                      {req.title}
                    </h5>
                    <p className="text-sm text-gray-700">{req.description}</p>
                  </div>
                  <IoCheckmarkCircle className="h-6 w-6 flex-shrink-0 text-gray-300" />
                </div>
              </div>
            );
          })}

          {/* Pathway Details */}
          {program.pathwayRequired && program.pathway && (
            <ProgramPathwayView
              pathway={program.pathway}
              className="rounded-lg border border-green-200 bg-green-50 p-4"
            />
          )}
        </div>
      )}
    </div>
  );
};
