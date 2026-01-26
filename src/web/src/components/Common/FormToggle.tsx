import React from "react";

const FormToggle: React.FC<{
  id: string;
  label: string;
  className?: string;
  labelClassName?: string;
  toggleClassName?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({
  id,
  label,
  inputProps,
  className,
  labelClassName,
  toggleClassName,
}) => {
  const { className: inputClassName, ...restInputProps } = inputProps ?? {};

  return (
    <label
      htmlFor={id}
      className={[
        "label inline-flex w-fit cursor-pointer items-center justify-normal gap-2 p-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        id={id}
        className={[
          "toggle toggle-success disabled:border-gray",
          toggleClassName,
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        {...restInputProps}
      />
      <span
        className={["label-text", labelClassName].filter(Boolean).join(" ")}
      >
        {label}
      </span>
    </label>
  );
};

export default FormToggle;
