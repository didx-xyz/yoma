import React from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

const FormField: React.FC<{
  label?: string;
  subLabel?: string;
  tooltip?: string;
  showWarningIcon?: boolean;
  showError?: boolean;
  error?: string;
  children?: React.ReactNode;
}> = ({
  label,
  subLabel,
  tooltip,
  showWarningIcon,
  showError,
  error,
  children,
}) => {
  return (
    <div className="form-control flex gap-2">
      {label && (
        <FormLabel
          label={label}
          subLabel={subLabel}
          tooltip={tooltip}
          showWarningIcon={!!showWarningIcon}
        />
      )}

      {children}

      {error && showError && <FormError label={error} />}
    </div>
  );
};
export default FormField;
