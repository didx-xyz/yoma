import React from "react";

// extend the type to include an index signature for data-* attributes
interface CustomInputHTMLAttributes<T> extends React.InputHTMLAttributes<T> {
  [key: `data-${string}`]: string | undefined;
}

const FormInput: React.FC<{
  inputProps?: CustomInputHTMLAttributes<HTMLInputElement>;
}> = ({ inputProps }) => {
  return (
    <input
      className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
      {...inputProps}
    />
  );
};

export default FormInput;
