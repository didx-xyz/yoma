import { IoIosInformationCircleOutline } from "react-icons/io";
import { IoMdAlert } from "react-icons/io";
import FormTooltip from "./FormTooltip";
import { Fragment } from "react";

const FormLabel: React.FC<{
  label: string;
  subLabel?: string;
  tooltip?: string;
  showWarningIcon: boolean;
}> = ({ label, subLabel, tooltip, showWarningIcon }) => {
  return (
    <label className="flex flex-col justify-start gap-0">
      <span className="flex flex-row items-center gap-2 text-sm font-bold">
        {label}

        {tooltip && (
          <FormTooltip label={tooltip}>
            <IoIosInformationCircleOutline className="h-5 w-5 text-green" />
          </FormTooltip>
        )}

        {showWarningIcon && (
          <FormTooltip label="This field is required.">
            <IoMdAlert className="mr-2x h-5 w-5 text-yellow" />
          </FormTooltip>
        )}
      </span>

      {subLabel && (
        <span className="text-xs">
          {subLabel.split("\\n").map((line, index, array) => (
            <Fragment key={index}>
              {line}
              {index < array.length - 1 && <br />}
            </Fragment>
          ))}
        </span>
      )}
    </label>
  );
};

export default FormLabel;
