import React from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

const FormField: React.FC<{
  label: string;
  subLabel?: string;
  tooltip?: string;
  showWarningIcon?: boolean;
  // isTouched?: boolean;
  // isSubmitted?: boolean;
  showError?: boolean;
  error?: string /*| undefined*/;
  children: React.ReactNode;
}> = ({
  label,
  subLabel,
  tooltip,
  // isTouched,
  // isSubmitted,
  showWarningIcon,
  showError,
  error,
  children,
}) => {
  return (
    <div className="form-control mb-2">
      <FormLabel
        label={label}
        subLabel={subLabel}
        tooltip={tooltip}
        showWarningIcon={!!showWarningIcon}
      />
      {/* isTouched: {isTouched?.toString()} */}
      {children}
      {error && showError && <FormError label={error} />}
    </div>
  );
};
export default FormField;
