import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IoCheckmarkCircle,
  IoHourglassOutline,
  IoTimeOutline,
  IoPeople,
} from "react-icons/io5";
import type {
  ReferralLinkUsageSearchResults,
  ReferralLinkUsageStatus,
  ReferralLinkUsage,
} from "~/api/models/referrals";
import { searchReferralLinkUsagesAsReferrer } from "~/api/services/referrals";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PAGE_SIZE } from "~/lib/constants";

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
    queryKey: ["ReferralLinkUsage", linkId, currentPage],
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

  const hasUsage = (usageData?.items?.length ?? 0) > 0;
  const totalCount = usageData?.totalCount ?? 0;

  return (
    <div
    // className="rounded-lg bg-white p-4 md:p-6"
    >
      {/* <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <IoPeople className="inline h-5 w-5 text-blue-600 md:h-6 md:w-6" />
        Referrals ({totalCount})
      </h2> */}

      <Suspense isLoading={isLoading} error={error as any}>
        <div>
          {!hasUsage && (
            <NoRowsMessage
              title="No Referrals Yet"
              description="When someone uses your referral link, their progress will appear here."
              icon={"👥"}
            />
          )}
          {hasUsage && (
            <>
              {/* Info Message */}
              <FormMessage messageType={FormMessageType.Info} className="mb-2">
                This shows everyone who has used your referral link and their
                progress through the program.
              </FormMessage>

              <div className="border-base-300 bg-base-100 space-y-2 overflow-hidden rounded-lg border">
                {usageData?.items?.map((usage: ReferralLinkUsage) => (
                  <div
                    key={usage.id}
                    // className="border-base-300 bg-base-100 overflow-hidden rounded-lg border"
                  >
                    <div className="flex min-w-0 items-center gap-2 p-4 hover:bg-gray-50">
                      <div className="font-family-nunito flex min-w-0 grow flex-col justify-center gap-0.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-black md:text-sm">
                          <IoPeople className="h-3 w-3 flex-shrink-0 text-blue-600" />
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
                        {new Date(usage.dateClaimed).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
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
                onClick={() =>
                  setCurrentPage((p: number) => Math.max(1, p - 1))
                }
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
    </div>
  );
};
