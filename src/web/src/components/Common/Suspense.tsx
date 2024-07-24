import { ApiErrors } from "../Status/ApiErrors";
import { LoadingSkeleton } from "../Status/LoadingSkeleton";
import FormMessage, { FormMessageType } from "./FormMessage";

type SuspenseProps = {
  isReady: boolean;
  isLoading?: boolean;
  error?: any;
  children: React.ReactNode;
};

const Suspense: React.FC<SuspenseProps> = ({
  isReady,
  isLoading,
  error,
  children,
}) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isLoading && !isReady && error) {
    return <ApiErrors error={error} />;
  }

  if (!isLoading && !error && isReady) {
    return children;
  }

  return null;
};

export default Suspense;
