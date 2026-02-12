import { useMemo, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import type { ReferralLink, ProgramInfo } from "~/api/models/referrals";
import { searchReferralLinks } from "~/api/services/referrals";
import { ReferrerLinkRow2 } from "./ReferrerLinkRow2";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";
import { LoadingInline } from "../Status/LoadingInline";
import { ReferralShareModal } from "./ReferralShareModal";

interface LinksListProps {
  programs?: ProgramInfo[];
  initialPageSize?: number;
}

export const ReferrerLinksList2: React.FC<LinksListProps> = ({
  programs = [],
  initialPageSize = 3,
}) => {
  const [selectedLinkForUsage, setSelectedLinkForUsage] =
    useState<ReferralLink | null>(null);

  const {
    items: links,
    error,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
  } = usePaginatedQuery<ReferralLink>({
    queryKey: ["ReferralLinks"],
    queryFn: async (pageNumber, pageSize) => {
      const result = await searchReferralLinks({
        pageNumber,
        pageSize,
        programId: null,
        valueContains: null,
        statuses: null,
      });
      return {
        items: result.items || [],
        totalCount: result.totalCount || 0,
      };
    },
    pageSize: initialPageSize,
  });

  const hasLinks = links.length > 0;
  const hasPrograms = programs.length > 0;

  const selectedProgram = useMemo(() => {
    if (!selectedLinkForUsage) return undefined;
    return programs.find((p) => p.id === selectedLinkForUsage.programId);
  }, [programs, selectedLinkForUsage]);

  // Reset expansion state on refresh (e.g., after creating a link) by forcing
  // link rows to remount whenever the first page of results changes.
  const firstPageKey = links
    .slice(0, initialPageSize)
    .map((l) => l.id)
    .join("|");

  return (
    <>
      <ReferralShareModal
        isOpen={!!selectedLinkForUsage}
        onClose={() => setSelectedLinkForUsage(null)}
        link={selectedLinkForUsage}
        rewardAmount={selectedProgram?.zltoRewardReferee}
      />

      <Suspense
        isLoading={isLoading && !hasLinks}
        error={error as any}
        loader={
          <LoadingInline
            className="rounded-xl bg-white p-4"
            classNameSpinner="h-12 border-orange w-12"
          />
        }
      >
        {!hasLinks && !hasPrograms && (
          <NoRowsMessage
            title="No Links Yet"
            description="You haven't created any referral links yet. Create one now!"
            icon={"🔗"}
          />
        )}
        {!hasLinks && hasPrograms && (
          <NoRowsMessage
            title="Create Your First Link"
            description="Start sharing Yoma and earning rewards together with your network!"
            icon={"🔗"}
          />
        )}

        {hasLinks && (
          <div className="space-y-2">
            <div className="border-base-300 bg-base-100 divide-y divide-gray-300 overflow-visible rounded-lg border px-4">
              {links?.map((link: ReferralLink) => (
                <ReferrerLinkRow2
                  key={`${firstPageKey}-${link.id}`}
                  link={link}
                  programs={programs}
                  //isExpanded={index === 0}
                  isExpanded={true}
                  onOpenShareModal={setSelectedLinkForUsage}
                />
              ))}
            </div>

            {/* See More Button */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange disabled:!border-orange disabled:!text-orange flex-1 normal-case hover:text-white disabled:!bg-transparent disabled:!opacity-70 md:max-w-[200px]"
                >
                  {isFetching ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      See More Links
                      <IoChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Suspense>
    </>
  );
};
