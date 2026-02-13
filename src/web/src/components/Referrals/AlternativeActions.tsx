import { useSession } from "next-auth/react";
import Link from "next/link";
import { IoArrowForward } from "react-icons/io5";

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
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-orange-50 text-lg md:h-12 md:w-12">
          🚀
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
        {isAuthenticated && (
          <Link
            href="/yoid/wallet"
            className="btn btn-sm bg-orange w-full gap-2 text-white hover:brightness-110 md:w-auto md:min-w-[180px]"
          >
            <IoArrowForward className="h-4 w-4" />
            See your wallet
          </Link>
        )}

        <Link
          href="/marketplace"
          className="btn btn-sm bg-orange w-full gap-2 text-white hover:brightness-110 md:w-auto md:min-w-[180px]"
        >
          <IoArrowForward className="h-4 w-4" />
          Browse marketplace
        </Link>

        <Link
          href="/opportunities"
          className="btn btn-sm bg-orange w-full gap-2 text-white hover:brightness-110 md:w-auto md:min-w-[180px]"
        >
          <IoArrowForward className="h-4 w-4" />
          Find more opportunities
        </Link>
      </div>
    </div>
  );
};
