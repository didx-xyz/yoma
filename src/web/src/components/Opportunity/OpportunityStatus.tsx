import React from "react";

const OpportunityStatus: React.FC<{
  status: string;
}> = ({ status }) => {
  return (
    <>
      {status == "Active" && (
        <span className="badge bg-blue-light text-blue">Active</span>
      )}
      {status == "Expired" && (
        <span className="badge bg-green-light text-yellow">Expired</span>
      )}
      {status == "Inactive" && (
        <span className="badge bg-yellow-tint text-yellow">Inactive</span>
      )}
      {status == "Deleted" && (
        <span className="badge bg-green-light  text-red-400">Deleted</span>
      )}
    </>
  );
};

export default OpportunityStatus;
