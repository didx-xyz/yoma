import Link from "next/link";
import { useRouter } from "next/router";
import {
  IoIosCalculator,
  IoMdCheckmarkCircleOutline,
  IoMdOpen,
  IoMdPerson,
} from "react-icons/io";
import type { OpportunityInfoAnalytics } from "~/api/models/organizationDashboard";
import { AvatarImage } from "~/components/AvatarImage";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";

export const OpportunityCard: React.FC<{
  opportunity: OpportunityInfoAnalytics;
  orgId: string;
}> = ({ opportunity, orgId }) => {
  const router = useRouter();

  return (
    <Link
      href={`/organisations/${orgId}/opportunities/${
        opportunity.id
      }/info?returnUrl=${encodeURIComponent(router.asPath)}`}
      className="flex w-full flex-col gap-2 overflow-hidden overflow-ellipsis rounded-lg bg-white px-2 py-4 text-xs shadow"
    >
      <div className="mb-1 flex items-center gap-2 text-sm">
        <AvatarImage
          icon={opportunity?.organizationLogoURL}
          alt="Organization Logo"
          size={40}
        />
        <p className="line-clamp-2">{opportunity.title}</p>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Views:</div>
        <div className="badge bg-green-light text-green">
          <IoMdPerson className="mr-1 text-sm" /> {opportunity.viewedCount}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Conversion ratio:</div>
        <div className="badge bg-green-light text-green">
          <IoIosCalculator className="mr-1 text-sm" />
          {
            opportunity.conversionRatioPercentage
          }%
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Completions:</div>
        <div className="badge bg-green-light text-green">
          <IoMdCheckmarkCircleOutline className="mr-1 text-sm" />
          {opportunity.completedCount}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Go-To Clicks:</div>
        <div className="badge bg-green-light text-green">
          <IoMdOpen className="mr-1 text-sm" />
          {opportunity.navigatedExternalLinkCount}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Status:</div>
        <OpportunityStatus status={opportunity?.status?.toString()} />
      </div>
    </Link>
  );
};
