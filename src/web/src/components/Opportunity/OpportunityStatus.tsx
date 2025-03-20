import React from "react";

const OpportunityStatus: React.FC<{ status: string }> = ({ status }) => {
  function renderStatusBadge(status: string): JSX.Element | null {
    switch (status) {
      case "Active":
        return (
          <span className="badge w-20 bg-green-light text-green">Active</span>
        );
      case "Inactive":
        return (
          <span className="badge w-20 bg-yellow-tint text-yellow">
            Inactive
          </span>
        );
      case "Expired":
        return (
          <span className="badge w-20 bg-yellow-tint text-yellow">Expired</span>
        );
      case "Deleted":
        return (
          <span className="badge w-20 bg-yellow-tint text-red-400">
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
