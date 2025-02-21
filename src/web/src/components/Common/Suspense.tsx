import { ApiErrors } from "../Status/ApiErrors";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";

interface SuspenseProps {
  isLoading: boolean;
  error?: any;
  children: React.ReactNode;
  loader?: React.ReactNode;
}

const Suspense: React.FC<SuspenseProps> = ({
  isLoading,
  error,
  children,
  loader = <LoadingSkeleton />,
}) => {
  if (isLoading) {
    return loader;
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <ApiErrors error={error} />
      </div>
    );
  }

  return <div className="animate-fade-in">{children}</div>;
};

export default Suspense;
