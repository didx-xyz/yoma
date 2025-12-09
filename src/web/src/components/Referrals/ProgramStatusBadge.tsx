import { ProgramStatus } from "~/api/models/referrals";

interface ProgramStatusBadgeProps {
  status: string | ProgramStatus;
}

export const ProgramStatusBadge: React.FC<ProgramStatusBadgeProps> = ({
  status,
}) => {
  const getStatusLabel = (status: string | ProgramStatus) => {
    switch (status) {
      case "Deleted":
        return "Deleted";
      case "LimitReached":
        return "Limit Reached";
      case "UnCompletable":
        return "Uncompletable";
      default:
        return status;
    }
  };

  // Active
  if (status === "Active") {
    return (
      <span className="badge bg-green-light text-green shrink-0">
        {getStatusLabel(status)}
      </span>
    );
  }

  // Inactive
  if (status === "Inactive") {
    return (
      <span className="badge bg-yellow-tint text-yellow shrink-0">
        {getStatusLabel(status)}
      </span>
    );
  }

  // Expired
  if (status === "Expired") {
    return (
      <span className="badge bg-orange-light text-orange shrink-0">
        {getStatusLabel(status)}
      </span>
    );
  }

  // Deleted
  if (status === "Deleted") {
    return (
      <span className="badge bg-green-light shrink-0 text-red-400">
        {getStatusLabel(status)}
      </span>
    );
  }

  // LimitReached
  if (status === "LimitReached") {
    return (
      <span className="badge bg-purple-light text-purple shrink-0">
        {getStatusLabel(status)}
      </span>
    );
  }

  // UnCompletable
  if (status === "UnCompletable") {
    return (
      <span className="badge shrink-0 bg-red-100 text-red-700">
        {getStatusLabel(status)}
      </span>
    );
  }

  // Default
  return (
    <span className="badge bg-gray-light text-gray-dark shrink-0">
      {getStatusLabel(status)}
    </span>
  );
};
