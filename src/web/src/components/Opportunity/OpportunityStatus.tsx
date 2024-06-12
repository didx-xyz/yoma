import React from "react";
import {
  IoMdBed,
  IoIosBicycle,
  IoIosBatteryDead,
  IoIosTrash,
} from "react-icons/io";

const OpportunityStatus: React.FC<{
  status: string;
}> = ({ status }) => {
  function renderStatusBadge(status: string): JSX.Element | null {
    switch (status) {
      case "Inactive":
        return (
          <span className="badge bg-blue-light text-yellow">
            <IoMdBed className="mr-1 text-sm" />
            Inactive
          </span>
        );
      case "Active":
        return (
          <span className="badge bg-blue-light text-blue">
            <IoIosBicycle className="mr-1 text-sm" />
            Active
          </span>
        );
      case "Expired":
        return (
          <span className="badge bg-yellow-tint text-yellow">
            <IoIosBatteryDead className="mr-1 text-sm" />
            Expired
          </span>
        );
      case "Deleted":
        return (
          <span className="badge bg-green-light text-red-400">
            <IoIosTrash className="mr-1 text-sm" />
            Deleted
          </span>
        );
      default:
        return null;
    }
  }

  return renderStatusBadge(status);
};

export default OpportunityStatus;
