import { ApiErrors } from "../Status/ApiErrors";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";

interface SuspenseProps {
  isReady: boolean;
  isLoading: boolean;
  error?: any;
  children: React.ReactNode;
}

const Suspense: React.FC<SuspenseProps> = ({
  isReady,
  isLoading,
  error,
  children,
}) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isReady && error) {
    return <ApiErrors error={error} />;
  }

  if (!error && isReady) {
    return children;
  }

  return null;
};

export default Suspense;
