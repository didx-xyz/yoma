const FormError: React.FC<{
  label: string;
  /** referenced by the control's aria-describedby / aria-errormessage, when supplied */
  id?: string;
}> = ({ label, id }) => {
  return (
    <span
      id={id}
      role="alert"
      className="text-start text-xs text-red-500 italic"
    >
      {label}
    </span>
  );
};

export default FormError;
