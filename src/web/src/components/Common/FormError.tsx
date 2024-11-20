const FormError: React.FC<{
  label: string;
}> = ({ label }) => {
  return (
    <span className="text-start text-xs italic text-red-500">{label}</span>
  );
};

export default FormError;
