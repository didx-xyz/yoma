import Image from "next/image";
import Link from "next/link";
import type { Opportunity } from "~/api/models/opportunity";
import PublicBadges from "./Badges/PublicBadges";

interface OpportunityPublicSmallRowProps {
  opportunity: Opportunity;
}

const OpportunityPublicSmallRow: React.FC<OpportunityPublicSmallRowProps> = ({
  opportunity,
}) => {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 transition-opacity hover:opacity-80"
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Organization Name */}
          {opportunity.organizationName && (
            <p className="text-xs font-medium text-gray-600">
              {opportunity.organizationName}
            </p>
          )}

          {/* Title */}
          <p className="line-clamp-2 text-sm font-semibold break-words text-gray-900">
            {opportunity.title}
          </p>

          {/* Description */}
          {(opportunity.summary || opportunity.description) && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-600">
              {opportunity.summary || opportunity.description}
            </p>
          )}

          {/* Badges */}
          <PublicBadges opportunity={opportunity as any} />
        </div>

        {/* Organization Logo */}
        {opportunity.organizationLogoURL && (
          <div className="flex-shrink-0">
            <Image
              src={opportunity.organizationLogoURL}
              alt={opportunity.organizationName || "Organization"}
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
          </div>
        )}
      </div>
    </Link>
  );
};

export default OpportunityPublicSmallRow;
