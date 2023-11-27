export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="flex w-64 flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="skeleton h-16 w-20 shrink-0 rounded-full bg-gray"></div>
        <div className="flex flex-col gap-4">
          <div className="skeleton h-4 w-24 bg-gray"></div>
          <div className="skeleton h-4 w-32 bg-gray"></div>
        </div>
      </div>
      <div className="skeleton h-32 w-full bg-gray"></div>
    </div>
  );
};
