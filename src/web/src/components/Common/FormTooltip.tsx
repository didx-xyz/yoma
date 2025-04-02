import React from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";

const FormTooltip: React.FC<{
  label: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ label, className, children }) => {
  return (
    <span className={`tooltip tooltip-secondary ${className}`} data-tip={label}>
      {!children && (
        <IoIosInformationCircleOutline className="text-green h-5 w-5" />
      )}
      {children}
    </span>
  );
};

export default FormTooltip;
