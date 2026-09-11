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
  /** id of the control inside, so the label is programmatically associated with it. */
  htmlFor?: string;
  /** id given to the error text, for the control's `aria-describedby`/`aria-errormessage`. */
  errorId?: string;
  children?: React.ReactNode;
}> = ({
  label,
  subLabel,
  tooltip,
  showWarningIcon,
  showError,
  error,
  badge,
  htmlFor,
  errorId,
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
          htmlFor={htmlFor}
        />
      )}

      {children}

      {error && showError && <FormError label={error} id={errorId} />}
    </fieldset>
  );
};
export default FormField;
