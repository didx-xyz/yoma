import React from "react";

// extend the type to include an index signature for data-* attributes
type DataAttributes = Record<`data-${string}`, string | undefined>;

interface CustomInputHTMLAttributes<T>
  extends React.TextareaHTMLAttributes<T>,
    DataAttributes {}

interface CustomInputHTMLAttributes<T>
  extends React.TextareaHTMLAttributes<T>,
    DataAttributes {}

const FormTextArea: React.FC<{
  inputProps?: CustomInputHTMLAttributes<HTMLTextAreaElement>;
}> = ({ inputProps }) => {
  return (
    <textarea
      className="input textarea border-gray focus:border-gray h-16 w-full rounded-md text-[1rem] leading-tight focus:outline-none"
      {...inputProps}
    />
  );
};

export default FormTextArea;
