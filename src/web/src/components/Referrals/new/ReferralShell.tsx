import Image from "next/image";
import { type ReactNode } from "react";
import { FiChevronLeft } from "react-icons/fi";
import Suspense from "~/components/Common/Suspense";

interface ReferralShellProps {
  title: string;
  breadcrumbLabel: string;
  programImageUrl?: string;
  headerBackgroundMode?: "image" | "color";
  headerBackgroundColorClassName?: string;
  onBack: () => void;
  children: ReactNode;
  isLoading?: boolean;
  loader?: ReactNode;
}

export const ReferralShell = ({
  title,
  breadcrumbLabel,
  programImageUrl,
  headerBackgroundMode = "image",
  headerBackgroundColorClassName = "bg-purple",
  onBack,
  children,
  isLoading = false,
  loader,
}: ReferralShellProps) => {
  const defaultLoader = (
    <div className="relative z-10 mx-auto mt-16 box-border w-full max-w-7xl px-4 py-4 sm:px-6 md:mt-20 lg:px-8">
      <div className="flex flex-col gap-2 py-6 sm:flex-row">
        <div className="grow overflow-hidden px-2 text-sm text-ellipsis md:whitespace-nowrap">
          <div className="skeleton h-4 w-56 bg-white/40 md:w-80" />
        </div>
      </div>

      <div className="space-y-4 px-2 pb-4">
        <div className="skeleton h-36 w-full rounded-2xl bg-gray-300" />

        <div className="mt-4 flex flex-col gap-4 md:flex-row">
          <div className="space-y-4 md:w-[66%]">
            <div className="skeleton h-36 w-full rounded-2xl bg-gray-300" />
            <div className="skeleton h-36 w-full rounded-2xl bg-gray-300" />
          </div>
          <div className="space-y-4 md:w-[34%]">
            <div className="skeleton h-36 w-full rounded-2xl bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );

  const shellLoader = loader ?? defaultLoader;

  const shellBody = (
    <div className="relative z-10 mx-auto mt-16 box-border w-full max-w-7xl px-4 py-4 sm:px-6 md:mt-20 lg:px-8">
      <div className="flex flex-col gap-2 py-6 sm:flex-row">
        <div className="min-w-0 grow overflow-hidden px-2 text-sm whitespace-nowrap">
          <ul className="flex w-full min-w-0 items-center text-xs font-semibold tracking-wide md:text-sm">
            <li className="inline-flex shrink-0 items-center">
              <button
                className="group inline-flex cursor-pointer items-center gap-4 text-white"
                onClick={onBack}
                aria-label="Back"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors group-hover:bg-white/25 md:h-12 md:w-12">
                  <FiChevronLeft
                    className="h-4 w-4 md:h-8 md:w-8"
                    aria-hidden="true"
                  />
                </span>
                <span className="whitespace-nowrap text-white">
                  {breadcrumbLabel}
                </span>
              </button>
            </li>
            <li className="inline shrink-0">
              <p className="mx-2 inline text-white">|</p>
            </li>
            <li className="min-w-0 flex-1">
              <div className="block w-full max-w-[600px] truncate align-bottom text-white">
                {title}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-2 md:mt-0">{children}</div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-gray-100">
      <div className="absolute inset-x-0 top-0 h-[160px] md:h-[220px]">
        {headerBackgroundMode === "image" && programImageUrl ? (
          <Image
            src={programImageUrl}
            alt={title || "Referral programme"}
            fill
            sizes="100vw"
            priority={true}
            className="object-cover"
          />
        ) : (
          <div className={`h-full w-full ${headerBackgroundColorClassName}`} />
        )}
      </div>

      <Suspense isLoading={isLoading} loader={shellLoader}>
        {shellBody}
      </Suspense>
    </div>
  );
};
