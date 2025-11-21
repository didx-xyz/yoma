export const LoadingInline: React.FC<{
  className?: string;
  classNameSpinner?: string;
  classNameLabel?: string;
  label?: string;
}> = ({
  className = "flex-col",
  classNameSpinner = "h-32 w-32 border-purple",
  classNameLabel = "text-sm text-gray-dark",
  label = "Loading...",
}) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 ${classNameSpinner}`}
      />
      <p className={`${classNameLabel}`}>{label}</p>
    </div>
  );
};
