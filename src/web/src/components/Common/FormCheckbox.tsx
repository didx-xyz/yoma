import React from "react";

const FormCheckbox: React.FC<{
  id: string;
  label: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({ id, label, inputProps }) => {
  return (
    <label htmlFor={id} className="label cursor-pointer justify-normal p-0">
      <input
        type="checkbox"
        id={id}
        className="checkbox-primary checkbox disabled:border-gray"
        {...inputProps}
      />
      <span className="label-text ml-4">{label}</span>
    </label>
  );
};

export default FormCheckbox;
