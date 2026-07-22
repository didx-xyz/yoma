import { IoMdPause, IoMdPlay } from "react-icons/io";
import type { OpportunityInfo } from "~/api/models/opportunity";

interface BadgesProps {
  opportunity: OpportunityInfo | undefined;
  isAdmin: boolean;
}

const OrgAdminBadges: React.FC<BadgesProps> = ({ opportunity, isAdmin }) => {
  return (
    <div className="text-green-dark flex flex-row flex-wrap gap-2 border-none font-bold">
      {/* STATUS BADGES */}
      {opportunity?.status == "Active" && (
        <div className="badge bg-green-light text-green border-none text-xs">
          Active
        </div>
      )}
      {opportunity?.status == "Expired" && (
        <div className="badge bg-yellow-tint text-yellow border-none text-xs">
          Expired
        </div>
      )}
      {opportunity?.status == "Inactive" && (
        <div className="badge bg-yellow-tint text-yellow border-none text-xs">
          Inactive
        </div>
      )}
      {opportunity?.status == "Deleted" && (
        <div className="badge bg-yellow-tint text-yellow border-none text-xs">
          Archived
        </div>
      )}

      {opportunity?.hidden ? (
        <span className="badge bg-yellow-tint text-yellow border-none text-xs">
          Hidden
        </span>
      ) : (
        <span className="badge bg-green-light text-green border-none text-xs">
          Visible
        </span>
      )}

      {/* ADMINS CAN SEE THE FEATURED FLAG */}
      {isAdmin && opportunity?.featured && (
        <div className="badge bg-blue-light text-blue border-none text-xs">
          Featured
        </div>
      )}
    </div>
  );
};

export default OrgAdminBadges;
