import React from "react";

const FormCheckbox: React.FC<{
  id: string;
  label: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({ id, label, inputProps }) => {
  return (
    <label htmlFor={id} className="label w-full cursor-pointer justify-normal">
      <input
        type="radio"
        id={id}
        className="radio-primary radio"
        {...inputProps}
      />
      <span className="label-text ml-4">{label}</span>
    </label>
  );
};

export default FormCheckbox;
