import { useMemo, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import type { ReferralLink, ProgramInfo } from "~/api/models/referrals";
import { searchReferralLinks } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { usePaginatedQuery } from "~/hooks/usePaginatedQuery";
import { LoadingInline } from "../Status/LoadingInline";
import { ReferralShareModal } from "./ReferralShareModal";
import Image from "next/image";
import Link from "next/link";
import { FaShareAlt } from "react-icons/fa";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";

interface ReferrerLinkRowProps {
  link: ReferralLink;
  programs: ProgramInfo[];
  isExpanded?: boolean;
  onOpenShareModal?: (link: ReferralLink) => void;
}

const ReferrerLinkRow: React.FC<ReferrerLinkRowProps> = ({
  link,
  onOpenShareModal,
}) => {
  const hasStatus = !!link.status;
  const statusLabel = hasStatus
    ? link.status === "LimitReached"
      ? "Limit Reached"
      : link.status
    : "—";

  return (
    <div className="flex w-full items-center justify-between gap-3 py-4 select-none">
      <div className="flex max-w-full min-w-0 flex-1 flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/referrals/link/${link.id}`}
            className="font-family-nunito text-base-content block min-w-0 overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap transition-opacity hover:opacity-75 md:text-sm"
          >
            {link?.programName ?? link?.name ?? "N/A"}
          </Link>
        </div>

        <div className="flex shrink-0 flex-row items-start gap-2 md:items-center md:justify-center md:px-4">
          <span className="text-base-content/70 text-xs">
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {link.dateCreated}
            </Moment>
          </span>
          <div className="flex items-center gap-2">
            {link.status === "Active" ? (
              <Image
                src="/images/icon-referral-stats-completed.svg"
                alt="Active"
                width={14}
                height={14}
                className="shrink-0"
              />
            ) : link.status === "LimitReached" ? (
              <Image
                src="/images/icon-referral-stats-pending.svg"
                alt="Limit Reached"
                width={14}
                height={14}
                className="shrink-0"
              />
            ) : (
              <Image
                src="/images/icon-referral-stats-expired.svg"
                alt="Status"
                width={11}
                height={11}
                className="shrink-0"
              />
            )}
            <span className="text-base-content/70 text-xs font-bold">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onOpenShareModal?.(link)}
          className="btn btn-sm bg-orange btn-circle shrink-0 gap-2 p-0 px-1 text-white hover:brightness-110 md:w-auto md:rounded-lg md:px-4"
          disabled={link.status !== "Active"}
        >
          <FaShareAlt className="h-3 w-3" />
          <span className="hidden md:block">Share</span>
        </button>
      </div>
    </div>
  );
};

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
                <ReferrerLinkRow
                  key={`${firstPageKey}-${link.id}`}
                  link={link}
                  programs={programs}
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
