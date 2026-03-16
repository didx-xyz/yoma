import { type ReactNode } from "react";

interface ReferralStatCardProps {
  icon: ReactNode;
  header: string;
  description: string;
  className?: string;
}

export const ReferralStatCard = ({
  icon,
  header,
  description,
  className,
}: ReferralStatCardProps) => {
  return (
    <div
      className={`bg-base-200 flex items-start gap-3 rounded-lg p-3 ${className || ""}`}
    >
      <div className="referral-stat-card-icon-wrap text-gray-dark rounded-md bg-white p-2">
        <span className="referral-stat-card-icon">{icon}</span>
      </div>
      <div>
        <p className="referral-stat-card-header text-base font-semibold text-black">
          {header}
        </p>
        <p className="referral-stat-card-description text-gray-dark text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};
