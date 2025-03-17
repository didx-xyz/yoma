import { ApiErrors } from "../Status/ApiErrors";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";

interface SuspenseProps {
  className?: string;
  isLoading: boolean;
  error?: any;
  children: React.ReactNode;
  loader?: React.ReactNode;
}

const Suspense: React.FC<SuspenseProps> = ({
  className = "",
  isLoading,
  error,
  children,
  loader = <LoadingSkeleton />,
}) => {
  if (isLoading) {
    return <div className={`animate-fade-in ${className}`}>{loader}</div>;
  }

  if (error) {
    return (
      <div className={`animate-fade-in ${className}`}>
        <ApiErrors error={error} />
      </div>
    );
  }

  return <div className={`animate-fade-in ${className}`}>{children}</div>;
};

export default Suspense;
