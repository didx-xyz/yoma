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
    <div className="badge bg-green-light text-yellow ml-2 h-6 rounded-md font-bold uppercase">
      Limited functionality
    </div>
  );
};

export default LimitedFunctionalityBadge;
