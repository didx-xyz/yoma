import React from "react";
import type { ProgramInfo } from "~/api/models/referrals";
import ProgramBadges from "./ProgramBadges";
import { ProgramRow } from "./ProgramRow";

export interface ProgramDetailsProps {
  program: ProgramInfo;
  showBadges?: {
    status?: boolean;
    requirements?: boolean;
    limit?: boolean;
    rewards?: boolean;
    rewardsReferrer?: boolean;
    rewardsReferee?: boolean;
  };
  isExpanded?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
  onCreateLink?: () => void;
  selected?: boolean;
  className?: string;
  context?: "list" | "select" | "preview";
}

export const RefereeProgramDetails: React.FC<ProgramDetailsProps> = ({
  program,
  showBadges,
  showDetails: showDetailsOption = true,
  onClick,
  className = "",
  context = "list",
}) => {
  return (
    <ProgramRow program={program} onClick={onClick} className={className}>
      {showDetailsOption ? (
        context === "preview" ? (
          <div className="mt-3 mb-2">
            <ProgramBadges
              program={program}
              mode="large"
              showPathway={false}
              showBadges={showBadges}
            />
          </div>
        ) : (
          <ProgramBadges
            program={program}
            showToolTips={false}
            showBadges={showBadges}
          />
        )
      ) : null}
    </ProgramRow>
  );
};
