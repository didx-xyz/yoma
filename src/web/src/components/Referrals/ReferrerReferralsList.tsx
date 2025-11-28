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
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <IoPeople className="inline h-5 w-5 text-blue-600 md:h-6 md:w-6" />
        Referrals ({totalCount})
      </h2>

      <Suspense isLoading={isLoading} error={error as any}>
        <div>
          {!hasUsage && (
            <NoRowsMessage
              title="No Referrals Yet"
              description="When someone uses your referral link, their progress will appear here."
              icon={"👥"}
              className="border-gray rounded-lg border"
            />
          )}
          {hasUsage && (
            <>
              {/* Info Message */}
              <FormMessage messageType={FormMessageType.Info} className="mb-2">
                This shows everyone who has used your referral link and their
                progress through the program.
              </FormMessage>

              <div className="border-gray space-y-3 rounded-lg border">
                {usageData?.items?.map((usage: ReferralLinkUsage) => (
                  <div
                    key={usage.id}
                    className="border-gray rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    {/* User Info Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {usage.userDisplayName || "Anonymous User"}
                        </h4>
                        <p className="text-gray-dark text-xs">
                          {usage.userEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(usage.status)}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="text-gray-dark flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs">
                      <div>
                        <span className="font-semibold">Claimed:</span>{" "}
                        {new Date(usage.dateClaimed).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                      {usage.dateCompleted && (
                        <div className="text-green-600">
                          <span className="font-semibold">Completed:</span>{" "}
                          {new Date(usage.dateCompleted).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      )}
                      {usage.dateExpired && (
                        <div className="text-red-600">
                          <span className="font-semibold">Expired:</span>{" "}
                          {new Date(usage.dateExpired).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      )}
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
