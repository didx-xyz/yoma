const FormError: React.FC<{
  label: string;
}> = ({ label }) => {
  return (
    <label className="label -mb-5">
      <span className="label-text-alt italic text-red-500">{label}</span>
    </label>
  );
};

export default FormError;
