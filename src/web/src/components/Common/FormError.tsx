const FormError: React.FC<{
  label: string;
}> = ({ label }) => {
  return (
    <span className="text-start text-xs text-red-500 italic">{label}</span>
  );
};

export default FormError;
