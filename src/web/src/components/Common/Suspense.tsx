import { ApiErrors } from "../Status/ApiErrors";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";

interface SuspenseProps {
  isLoading: boolean;
  error?: any;
  children: React.ReactNode;
}

const Suspense: React.FC<SuspenseProps> = ({ isLoading, error, children }) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ApiErrors error={error} />;
  }

  return children;
};

export default Suspense;
