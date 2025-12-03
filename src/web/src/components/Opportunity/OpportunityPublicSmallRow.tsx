import Image from "next/image";
import Link from "next/link";
import type { Opportunity } from "~/api/models/opportunity";
import PublicBadges from "./Badges/PublicBadges";

interface OpportunityPublicSmallRowProps {
  opportunity: Opportunity;
  isCompleted?: boolean;
  showBadges?: boolean;
}

const OpportunityPublicSmallRow: React.FC<OpportunityPublicSmallRowProps> = ({
  opportunity,
  isCompleted = false,
  showBadges = true,
}) => {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Organization Name */}
          {/* {opportunity.organizationName && (
            <p className="mb-1 text-xs font-medium text-gray-500">
              {opportunity.organizationName}
            </p>
          )} */}

          {/* Title */}
          <h4
            className={`mb-1 line-clamp-2 text-sm font-bold break-words text-gray-700 group-hover:text-blue-600 ${
              isCompleted ? "line-through opacity-60" : ""
            }`}
          >
            {opportunity.title}
          </h4>

          {/* Description */}
          {(opportunity.summary || opportunity.description) && (
            <p
              className={`mb-2 line-clamp-2 text-xs leading-relaxed text-gray-600 ${
                isCompleted ? "line-through opacity-60" : ""
              }`}
            >
              {opportunity.summary || opportunity.description}
            </p>
          )}

          {/* Badges */}
          {showBadges && (
            <div className="mt-auto">
              <PublicBadges opportunity={opportunity as any} />
            </div>
          )}
        </div>

        {/* Organization Logo */}
        <div className="flex-shrink-0">
          {opportunity.organizationLogoURL ? (
            <Image
              src={opportunity.organizationLogoURL}
              alt={opportunity.organizationName || "Organization"}
              width={48}
              height={48}
              className="rounded-lg border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
              <span className="text-lg font-bold text-gray-400">
                {opportunity.organizationName?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default OpportunityPublicSmallRow;
