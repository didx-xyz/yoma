import React from "react";

const FormInput: React.FC<{
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({ inputProps }) => {
  return (
    <input
      className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
      {...inputProps}
    />
  );
};

export default FormInput;
