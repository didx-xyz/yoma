import React from "react";

const OpportunityStatus: React.FC<{ status: string }> = ({ status }) => {
  function renderStatusBadge(status: string): JSX.Element | null {
    switch (status) {
      case "Active":
        return (
          <span className="badge bg-green-light text-green w-20">Active</span>
        );
      case "Inactive":
        return (
          <span className="badge bg-yellow-tint text-yellow w-20">
            Inactive
          </span>
        );
      case "Expired":
        return (
          <span className="badge bg-yellow-tint text-yellow w-20">Expired</span>
        );
      case "Deleted":
        return (
          <span className="badge bg-yellow-tint w-20 text-red-400">
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
