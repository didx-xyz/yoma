import React from "react";
import type { ProgramInfo } from "~/api/models/referrals";
import ProgramBadges from "./ProgramBadges";
import { ProgramRequirementsRows } from "./ProgramRequirementsRows";
import { ProgramRow } from "./ProgramRow";

export interface ProgramDetailsProps {
  program: ProgramInfo;
  perspective: "referrer" | "referee";
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
  showDetails: showDetailsOption = true,
  onClick,
  className = "",
  context = "list",
}) => {
  return (
    <ProgramRow program={program} onClick={onClick} className={className}>
      {showDetailsOption ? (
        context === "preview" ? (
          <div className="mt-3">
            <ProgramRequirementsRows
              program={program}
              showPathway={false}
              variant="large"
            />
          </div>
        ) : (
          <ProgramBadges program={program} showToolTips={false} />
        )
      ) : null}
    </ProgramRow>
  );
};
