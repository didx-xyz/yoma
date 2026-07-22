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
  /** Optional content rendered inline next to the label (e.g. a badge). */
  badge?: React.ReactNode;
  children?: React.ReactNode;
}> = ({
  label,
  subLabel,
  tooltip,
  showWarningIcon,
  showError,
  error,
  badge,
  children,
}) => {
  return (
    <fieldset className="fieldset">
      {label && (
        <FormLabel
          label={label}
          subLabel={subLabel}
          tooltip={tooltip}
          showWarningIcon={!!showWarningIcon}
          badge={badge}
        />
      )}

      {children}

      {error && showError && <FormError label={error} />}
    </fieldset>
  );
};
export default FormField;
