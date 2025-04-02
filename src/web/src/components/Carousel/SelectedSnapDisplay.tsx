import React from "react";

export const SelectedSnapDisplay: React.FC<{
  selectedSnap: number;
  snapCount: number;
}> = (props) => {
  const { selectedSnap, snapCount } = props;

  return (
    <div className="md:text-gray-dark flex items-center justify-start text-xs font-semibold whitespace-nowrap select-none md:text-sm md:font-normal">
      {selectedSnap + 1} / {snapCount}
    </div>
  );
};
