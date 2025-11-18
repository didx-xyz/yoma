import Link from "next/link";
import { IoTrophy, IoArrowForward } from "react-icons/io5";

/**
 * AlternativeActions Component
 *
 * Displays alternative navigation options for users, typically shown
 * in error states or when primary actions are not available.
 *
 * @example
 * <AlternativeActions />
 */
export const AlternativeActions: React.FC = () => {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-center text-lg font-bold text-gray-900">
        Or Explore Other Options
      </h3>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link href="/opportunities" className="btn btn-primary gap-2 shadow-md">
          <IoTrophy className="h-5 w-5" />
          Browse Opportunities
        </Link>
        <Link href="/yoid" className="btn btn-secondary gap-2 shadow-md">
          <IoArrowForward className="h-5 w-5" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};
