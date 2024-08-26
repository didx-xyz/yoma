export const LoadingInline: React.FC<{
  className?: string;
  classNameSpinner?: string;
  classNameLabel?: string;
}> = ({
  className = "flex-col",
  classNameSpinner = "h-32 w-32 border-purple",
  classNameLabel = "text-sm text-gray-dark",
}) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-t-2 ${classNameSpinner}`}
      />
      <p className={`${classNameLabel}`}>Loading...</p>
    </div>
  );
};
