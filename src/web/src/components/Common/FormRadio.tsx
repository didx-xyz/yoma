import React from "react";

const FormRadio: React.FC<{
  id: string;
  label: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({ id, label, inputProps }) => {
  return (
    <label
      htmlFor={id}
      className="label w-full cursor-pointer justify-normal p-0"
    >
      <input
        type="radio"
        id={id}
        className="radio radio-primary"
        {...inputProps}
      />
      <span className="label-text ml-4">{label}</span>
    </label>
  );
};

export default FormRadio;
