import React from "react";
import { useAtomValue } from "jotai";
import { currentOrganisationInactiveAtom } from "~/lib/store";

const LimitedFunctionalityBadge: React.FC = () => {
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  if (!currentOrganisationInactive) {
    return null;
  }
  return (
    <div className="badge ml-2 h-6 rounded-md bg-green-light font-bold uppercase text-yellow">
      Limited functionality
    </div>
  );
};

export default LimitedFunctionalityBadge;
