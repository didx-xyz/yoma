export const LoadingInline: React.FC<{
  classNameSpinner?: string;
}> = ({ classNameSpinner = "border-purple" }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className={`h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 ${classNameSpinner}`}
        ></div>
        <p className="text-sm text-gray-dark">Loading...</p>
      </div>
    </div>
  );
};
