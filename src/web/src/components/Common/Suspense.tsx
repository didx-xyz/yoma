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
    return <div className={className}>{loader}</div>;
  }

  if (error) {
    return (
      <div className={className}>
        <ApiErrors error={error} />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

export default Suspense;
