import React from "react";

// extend the type to include an index signature for data-* attributes
type DataAttributes = Record<`data-${string}`, string | undefined>;

interface CustomInputHTMLAttributes<T>
  extends React.InputHTMLAttributes<T>,
    DataAttributes {}

interface CustomInputHTMLAttributes<T>
  extends React.InputHTMLAttributes<T>,
    DataAttributes {}

const FormInput: React.FC<{
  inputProps?: CustomInputHTMLAttributes<HTMLInputElement>;
}> = ({ inputProps }) => {
  return (
    <input
      className="input border-gray focus:border-gray w-full rounded-md focus:outline-none"
      {...inputProps}
    />
  );
};

export default FormInput;
