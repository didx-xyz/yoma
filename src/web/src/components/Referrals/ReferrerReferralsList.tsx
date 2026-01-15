import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IoCheckmarkCircle,
  IoHourglassOutline,
  IoTimeOutline,
  IoPerson,
} from "react-icons/io5";
import {
  ReferralLinkUsageStatus,
  type ReferralLinkUsage,
  type ReferralLinkUsageSearchResults,
} from "~/api/models/referrals";
import { searchReferralLinkUsagesAsReferrer } from "~/api/services/referrals";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import { PAGE_SIZE } from "~/lib/constants";
import { getReferralStatsMockMode } from "~/lib/referrals/referralStatsMock";
import { LoadingInline } from "../Status/LoadingInline";

interface ReferralsListProps {
  linkId: string;
}

export const ReferrerReferralsList: React.FC<ReferralsListProps> = ({
  linkId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch usage data for this link
  const {
    data: usageData,
    isLoading,
    error,
  } = useQuery<ReferralLinkUsageSearchResults>({
    queryKey: ["ReferralLinkUsage", linkId, currentPage, PAGE_SIZE],
    queryFn: () =>
      searchReferralLinkUsagesAsReferrer({
        linkId: linkId,
        programId: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!linkId,
  });

  const shouldMock =
    getReferralStatsMockMode() && (usageData?.items?.length ?? 0) === 0;

  const mockAllItems = shouldMock ? buildMockReferralUsages(linkId) : [];
  const mockItems = shouldMock
    ? mockAllItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : [];

  const displayUsageData: ReferralLinkUsageSearchResults | undefined =
    shouldMock
      ? {
          totalCount: mockAllItems.length,
          items: mockItems,
        }
      : usageData;

  const getStatusBadge = useCallback(
    (status: ReferralLinkUsageStatus | string) => {
      switch (status) {
        case "Completed":
          return (
            <span className="badge badge-sm bg-green-light text-green gap-1">
              <IoCheckmarkCircle className="h-3 w-3" />
              Completed
            </span>
          );
        case "Pending":
          return (
            <span className="badge badge-sm gap-1 bg-blue-50 text-blue-700">
              <IoHourglassOutline className="h-3 w-3" />
              Pending
            </span>
          );
        case "Expired":
          return (
            <span className="badge badge-sm bg-orange-light text-orange gap-1">
              <IoTimeOutline className="h-3 w-3" />
              Expired
            </span>
          );
        default:
          return <span className="badge badge-sm">{status}</span>;
      }
    },
    [],
  );

  const hasUsage = (displayUsageData?.items?.length ?? 0) > 0;
  const totalCount = displayUsageData?.totalCount ?? 0;

  return (
    <Suspense
      isLoading={isLoading}
      error={error as any}
      loader={
        <LoadingInline
          className="rounded-xl bg-white p-4"
          classNameSpinner="h-12 border-orange w-12"
        />
      }
    >
      <div>
        {!hasUsage && (
          <FormMessage
            messageType={FormMessageType.Info}
            className="mb-2"
            classNameLabel="text-base-content/60 text-[10px] leading-snug md:text-[11px]"
          >
            No Referrals Yet - When someone uses your referral link, their
            progress will appear here.
          </FormMessage>
        )}
        {hasUsage && (
          <>
            {/* Info Message */}
            <FormMessage
              messageType={FormMessageType.Info}
              className="mb-2"
              classNameLabel="text-base-content/60 text-[10px] leading-snug md:text-[11px]"
            >
              This shows everyone who has used your referral link and their
              progress through the program.
            </FormMessage>

            <div className="border-base-300 bg-base-100 space-y-2 overflow-visible rounded-lg border">
              {displayUsageData?.items?.map((usage: ReferralLinkUsage) => (
                <div key={usage.id}>
                  <div className="flex min-w-0 items-center gap-2 p-4 hover:bg-gray-50">
                    <div className="font-family-nunito flex min-w-0 grow flex-col justify-center gap-0.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-black md:text-sm">
                        <IoPerson className="h-3 w-3 flex-shrink-0 text-blue-600" />
                        <span className="truncate">
                          {usage.userDisplayName || "Anonymous User"}
                        </span>
                      </div>
                      {usage.userEmail && (
                        <div className="truncate pl-5 text-[10px] text-gray-500">
                          {usage.userEmail}
                        </div>
                      )}
                    </div>

                    <div className="text-gray hidden text-xs text-nowrap md:block md:text-sm">
                      {new Date(usage.dateClaimed).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>

                    <div className="flex-shrink-0">
                      {getStatusBadge(usage.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setCurrentPage((p: number) => p + 1)}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Suspense>
  );
};

const buildMockReferralUsages = (linkId: string): ReferralLinkUsage[] => {
  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const make = (
    index: number,
    status: ReferralLinkUsageStatus,
    userDisplayName: string,
    userEmail: string | null,
    claimedDaysAgo: number,
  ): ReferralLinkUsage => {
    const claimed = daysAgo(claimedDaysAgo);

    return {
      id: `${linkId}-mock-${index}`,
      programId: "mock-program",
      programName: "Mock Program",
      programDescription: null,
      programCompletionWindowInDays: 14,
      linkId,
      linkName: "Mock Link",
      userIdReferrer: "mock-referrer",
      usernameReferrer: "mock-referrer",
      userDisplayNameReferrer: "You",
      userEmailReferrer: null,
      userEmailConfirmedReferrer: null,
      userPhoneNumberReferrer: null,
      userPhoneNumberConfirmedReferrer: null,
      userId: `mock-user-${index}`,
      username: `mock.user.${index}`,
      userDisplayName,
      userEmail,
      userEmailConfirmed: null,
      userPhoneNumber: null,
      userPhoneNumberConfirmed: null,
      userYoIDOnboarded: null,
      statusId: status,
      status,
      zltoRewardReferrer: status === "Completed" ? 20 : 0,
      zltoRewardReferee: status === "Completed" ? 20 : 0,
      dateClaimed: claimed,
      dateCompleted:
        status === "Completed" ? daysAgo(claimedDaysAgo - 1) : null,
      dateExpired: status === "Expired" ? daysAgo(claimedDaysAgo - 7) : null,
      dateCreated: claimed,
      dateModified: claimed,
    };
  };

  return [
    make(
      1,
      ReferralLinkUsageStatus.Pending,
      "Ayesha N.",
      "ayesha@example.com",
      2,
    ),
    make(
      2,
      ReferralLinkUsageStatus.Completed,
      "Thabo M.",
      "thabo@example.com",
      5,
    ),
    make(3, ReferralLinkUsageStatus.Pending, "Lerato K.", null, 7),
    make(
      4,
      ReferralLinkUsageStatus.Completed,
      "Sipho D.",
      "sipho@example.com",
      12,
    ),
    make(5, ReferralLinkUsageStatus.Expired, "Anonymous User", null, 20),
    make(
      6,
      ReferralLinkUsageStatus.Completed,
      "Mina R.",
      "mina@example.com",
      28,
    ),
  ];
};
