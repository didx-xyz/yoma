import Link from "next/link";
import { useRouter } from "next/router";
import {
  IoIosBatteryDead,
  IoIosBicycle,
  IoIosCalendar,
  IoIosCheckmarkCircle,
  IoIosCloseCircle,
  IoIosMegaphone,
  IoIosTrash,
  IoMdBed,
  IoMdPerson,
} from "react-icons/io";
import type { Status } from "~/api/models/opportunity";
import type { YouthInfo } from "~/api/models/organizationDashboard";
import moment from "moment";
import { AvatarImage } from "~/components/AvatarImage";

export const YouthCompletedCard: React.FC<{
  opportunity: YouthInfo;
  orgId: string;
}> = ({ opportunity, orgId }) => {
  const router = useRouter();

  const handleStatusIcon = (status: Status) => {
    switch (status as any) {
      case "Inactive":
        return <IoMdBed className="mr-1 text-sm" />;
      case "Active":
        return <IoIosBicycle className="mr-1 text-sm" />;
      case "Expired":
        return <IoIosBatteryDead className="mr-1 text-sm" />;
      case "Deleted":
        return <IoIosTrash className="mr-1 text-sm" />;
      default:
        return <IoIosMegaphone className="mr-1 text-sm" />;
    }
  };

  const statusIcon = handleStatusIcon(opportunity.opportunityStatus);
  return (
    <Link
      href={`/organisations/${orgId}/opportunities/${
        opportunity.opportunityId
      }/info?returnUrl=${encodeURIComponent(router.asPath)}`}
      className="flex w-full flex-col gap-2 overflow-hidden rounded-lg bg-white px-2 py-4 text-xs shadow"
    >
      <div className="mb-1 flex items-center gap-2 text-sm">
        <AvatarImage
          icon={opportunity?.organizationLogoURL}
          alt="Organization Logo"
          size={40}
        />
        <p className="line-clamp-2">{opportunity.opportunityTitle}</p>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Student:</div>
        <div className="badge bg-green-light text-green">
          <IoMdPerson className="mr-1 text-sm" /> {opportunity.userDisplayName}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Date completed:</div>
        <div className="badge bg-green-light text-green">
          <IoIosCalendar className="mr-1 text-sm" />
          {opportunity.dateCompleted
            ? moment(new Date(opportunity.dateCompleted)).format("MMM D YYYY")
            : ""}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Status:</div>
        <div className="badge bg-green-light text-green">
          {statusIcon} {opportunity.opportunityStatus}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="tracking-wider">Verified:</div>
        {opportunity.verified ? (
          <IoIosCheckmarkCircle className="text-[1.5rem] text-green" />
        ) : (
          <IoIosCloseCircle className="text-[1.5rem] text-warning" />
        )}
      </div>
    </Link>
  );
};
