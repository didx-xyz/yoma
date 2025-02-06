import React from "react";

export const SelectedSnapDisplay: React.FC<{
  selectedSnap: number;
  snapCount: number;
}> = (props) => {
  const { selectedSnap, snapCount } = props;

  return (
    <div className="flex select-none items-center justify-start whitespace-nowrap text-xs font-semibold md:text-sm md:font-normal md:text-gray-dark">
      {selectedSnap + 1} / {snapCount}
    </div>
  );
};
