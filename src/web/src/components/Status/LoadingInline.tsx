export const LoadingInline: React.FC<{
  classNameSpinner?: string;
  classNameLabel?: string;
}> = ({
  classNameSpinner = "h-32 w-32 border-purple",
  classNameLabel = "text-sm text-gray-dark",
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className={`animate-spin rounded-full border-b-2 border-t-2 ${classNameSpinner}`}
        ></div>
        <p className={`${classNameLabel}`}>Loading...</p>
      </div>
    </div>
  );
};
