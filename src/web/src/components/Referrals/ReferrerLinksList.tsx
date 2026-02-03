import { useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IoChevronDown } from "react-icons/io5";
import type { ReferralLink, ProgramInfo } from "~/api/models/referrals";
import { searchReferralLinks } from "~/api/services/referrals";
import { ReferrerLinkRow } from "./ReferrerLinkRow";
import { ReferrerLinkDetails } from "./ReferrerLinkDetails";
import { ShareButtons } from "./ShareButtons";
import CustomModal from "~/components/Common/CustomModal";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";
import { LoadingInline } from "../Status/LoadingInline";

interface LinksListProps {
  programs?: ProgramInfo[];
  initialPageSize?: number;
}

export const ReferrerLinksList: React.FC<LinksListProps> = ({
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
      <CustomModal
        isOpen={!!selectedLinkForUsage}
        onRequestClose={() => setSelectedLinkForUsage(null)}
        className="md:max-h-[550px] md:w-[450px]"
      >
        {selectedLinkForUsage && (
          <div className="flex flex-col">
            <div className="bg-theme flex flex-row p-4 shadow-lg">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-white">
                  Share Your Link
                </h1>
              </div>
              <button
                type="button"
                className="btn btn-circle text-gray-dark hover:bg-gray btn-sm"
                onClick={() => setSelectedLinkForUsage(null)}
              >
                <IoMdClose className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-4 md:p-6">
              <ReferrerLinkDetails
                link={selectedLinkForUsage}
                className=""
                showQRCode={true}
                showShortLink={true}
                showCopyButton={true}
              />

              <div className="gap-2x flex w-full min-w-0 flex-col md:flex-1 md:basis-1/2">
                <div className="font-family-nunito font-semibold text-black">
                  Share Link
                </div>
                <div className="text-base-content/60 mb-4 text-sm">
                  Share your link on your preferred platform
                </div>
                <ShareButtons
                  url={
                    selectedLinkForUsage.shortURL ?? selectedLinkForUsage.url
                  }
                  size={30}
                  rewardAmount={selectedProgram?.zltoRewardReferee}
                />
              </div>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange flex-1 normal-case hover:text-white"
                  onClick={() => setSelectedLinkForUsage(null)}
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

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
                <ReferrerLinkRow
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
                  className="btn btn-sm border-orange gap-2 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
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
