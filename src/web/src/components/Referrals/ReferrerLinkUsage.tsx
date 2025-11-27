import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  IoCheckmarkCircle,
  IoHourglassOutline,
  IoTimeOutline,
  IoLink,
  IoStatsChart,
  IoPeople,
  IoGift,
} from "react-icons/io5";
import type {
  ReferralLink,
  ReferralLinkUsageSearchResults,
  ReferralLinkUsageStatus,
  ReferralLinkUsage,
  ProgramInfo,
} from "~/api/models/referrals";
import {
  searchReferralLinkUsagesAsReferrer,
  getReferralLinkById,
  getReferralProgramInfoById,
} from "~/api/services/referrals";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PAGE_SIZE } from "~/lib/constants";
import { ReferrerLinkDetails } from "./ReferrerLinkDetails";
import { RefereeProgramDetails } from "./RefereeProgramDetails";
import { ProgramRequirements } from "./ProgramRequirements";

interface LinkUsageProps {
  link: ReferralLink;
  showProgramDetails?: boolean;
  showQRCode?: boolean;
}

export const ReferrerLinkUsage: React.FC<LinkUsageProps> = ({
  link,
  showProgramDetails = false,
  showQRCode = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch full link details with QR code
  const {
    data: fullLinkData,
    isLoading: linkLoading,
    error: linkError,
  } = useQuery<ReferralLink>({
    queryKey: ["ReferralLinkDetail", link?.id, "withQR"],
    queryFn: () => getReferralLinkById(link?.id ?? "", true),
    enabled: !!link?.id,
  });

  // Fetch full program details (only if showProgramDetails is true)
  const {
    data: programData,
    isLoading: programLoading,
    error: programError,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgramInfo", link?.programId],
    queryFn: () => getReferralProgramInfoById(link?.programId ?? ""),
    enabled: !!link?.programId && showProgramDetails,
  });

  // Fetch usage data for this link
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
  } = useQuery<ReferralLinkUsageSearchResults>({
    queryKey: ["ReferralLinkUsage", link?.id, currentPage],
    queryFn: () =>
      searchReferralLinkUsagesAsReferrer({
        linkId: link?.id ?? "",
        programId: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!link?.id,
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

  const isLoading = linkLoading || programLoading || usageLoading;
  const error = linkError || programError || usageError;

  const hasUsage = (usageData?.items?.length ?? 0) > 0;
  const totalCount = usageData?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <Suspense isLoading={isLoading} error={error as any}>
        <div className="flex flex-col gap-4">
          {/* Link Details Section */}
          {fullLinkData && (
            <div className="shadow-custom rounded-lg bg-white p-6">
              <h2 className="mb-4 flex items-center gap-4 text-lg font-bold">
                <IoLink className="inline h-6 w-6 text-blue-600" /> Your
                Referral Link
              </h2>
              <ReferrerLinkDetails
                link={fullLinkData}
                mode="large"
                showQRCode={showQRCode}
                showShare={true}
                className=""
                hideLabels={!showQRCode}
              />
            </div>
          )}

          {/* Program Preview */}
          {showProgramDetails && programData && (
            <div className="shadow-custom space-y-3 rounded-lg bg-white p-6">
              <div>
                {/* Header */}
                <div className="mb-3">
                  <h3 className="flex items-center gap-2 text-base font-bold">
                    <IoGift className="h-5 w-5 text-orange-400" />
                    Selected Program
                  </h3>
                </div>
                <div className="bg-white">
                  <RefereeProgramDetails
                    program={programData}
                    context="preview"
                    perspective="referrer"
                  />
                </div>
              </div>
              <ProgramRequirements program={programData} showPathway={true} />
            </div>
          )}

          {/* Link Stats Summary */}
          <div className="shadow-custom space-y-2 rounded-lg bg-white p-6">
            <h2 className="mb-4 flex items-center gap-4 text-base font-bold text-gray-900">
              <IoStatsChart className="inline h-6 w-6 text-blue-600" />{" "}
              Performance Overview
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {totalCount || 0}
                </div>
                <div className="text-gray-dark text-xs">Total Referrals</div>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {fullLinkData?.completionTotal || 0}
                </div>
                <div className="text-gray-dark text-xs">Completed</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {fullLinkData?.pendingTotal || 0}
                </div>
                <div className="text-gray-dark text-xs">Pending</div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {fullLinkData?.zltoRewardCumulative || 0}
                </div>
                <div className="text-gray-dark text-xs">ZLTO Earned</div>
              </div>
            </div>
          </div>

          {/* Usage List */}
          <div className="shadow-custom rounded-lg bg-white p-6">
            <h2 className="mb-4 flex items-center gap-4 text-base font-bold text-gray-900">
              <IoPeople className="inline h-6 w-6 text-blue-600" /> Referrals (
              {totalCount})
            </h2>

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
                  <FormMessage
                    messageType={FormMessageType.Info}
                    className="mb-2"
                  >
                    This shows everyone who has used your referral link and
                    their progress through the program.
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
          </div>
        </div>
      </Suspense>
    </div>
  );
};
