import { useSession } from "next-auth/react";
import Link from "next/link";
import { IoRocket, IoStorefront, IoTrophy } from "react-icons/io5";

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
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-lg md:p-6">
      <h3 className="mb-4 text-center text-base font-bold text-gray-900 md:text-lg">
        Or Explore Other Options
      </h3>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link
          href="/opportunities"
          className="btn btn-primary btn-sm md:btn-md gap-2 shadow-md"
        >
          <IoRocket className="h-4 w-4 md:h-5 md:w-5" />
          Find Opportunities
        </Link>
        <Link
          href="/marketplace"
          className="btn bg-blue btn-sm md:btn-md gap-2 text-white shadow-md"
        >
          <IoStorefront className="h-4 w-4 md:h-5 md:w-5" />
          Explore Marketplace
        </Link>
        {isAuthenticated && (
          <Link
            href="/yoid"
            className="btn btn-secondary btn-sm md:btn-md gap-2 shadow-md"
          >
            <IoTrophy className="h-4 w-4 md:h-5 md:w-5" />
            View Dashboard
          </Link>
        )}
      </div>
    </div>
  );
};
