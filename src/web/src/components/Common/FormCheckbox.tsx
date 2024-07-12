import React from "react";

const FormCheckbox: React.FC<{
  id: string;
  label: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({ id, label, inputProps }) => {
  return (
    <label htmlFor={id} className="label w-full cursor-pointer justify-normal">
      <input
        type="checkbox"
        id={id}
        className="checkbox-primary checkbox"
        {...inputProps}
      />
      <span className="label-text ml-4">{label}</span>
    </label>
  );
};

export default FormCheckbox;
