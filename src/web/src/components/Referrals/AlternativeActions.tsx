import { useSession } from "next-auth/react";
import Link from "next/link";
import { IoList, IoRocket, IoStorefront, IoTrophy } from "react-icons/io5";

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
    <div className="border-base-300 bg-base-100 rounded-xl border p-4 shadow-sm md:p-5">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 md:h-12 md:w-12">
          <IoList className="h-5 w-5 text-blue-700 md:h-6 md:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
            Explore other options
          </h3>
          <p className="text-base-content/60 mt-1 line-clamp-2 text-[10px] leading-snug md:text-xs">
            You can still browse opportunities and the marketplace.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/opportunities"
          className="btn btn-sm inline-flex items-center gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          <IoRocket className="h-4 w-4" />
          Find more opportunities
        </Link>

        <Link
          href="/marketplace"
          className="btn btn-sm inline-flex items-center gap-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
        >
          <IoStorefront className="h-4 w-4" />
          Browse marketplace
        </Link>

        {isAuthenticated && (
          <Link
            href="/yoid/wallet"
            className="btn btn-sm inline-flex items-center gap-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            <IoTrophy className="h-4 w-4" />
            See your achievements
          </Link>
        )}
      </div>
    </div>
  );
};
