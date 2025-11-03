import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { IoMdClose } from "react-icons/io";
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
  ReferralLinkUsageInfo,
  ReferralLinkUsageSearchResults,
  ReferralLinkUsageStatus,
  ProgramInfo,
} from "~/api/models/referrals";
import {
  searchReferralLinkUsagesAsReferrer,
  getReferralLinkById,
  getReferralProgramInfoById,
} from "~/api/services/referrals";
import CustomModal from "~/components/Common/CustomModal";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PAGE_SIZE } from "~/lib/constants";
import { LinkDetails } from "./LinkDetails";
import { ProgramCard } from "./ProgramCard";
import { ProgramRequirements } from "./ProgramRequirements";

interface LinkUsageModalProps {
  link: ReferralLink | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LinkUsageModal: React.FC<LinkUsageModalProps> = ({
  link,
  isOpen,
  onClose,
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
    enabled: isOpen && !!link?.id,
  });

  // Fetch full program details
  const {
    data: programData,
    isLoading: programLoading,
    error: programError,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgramInfo", link?.programId],
    queryFn: () => getReferralProgramInfoById(link?.programId ?? ""),
    enabled: isOpen && !!link?.programId,
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
    enabled: isOpen && !!link?.id,
  });

  const getStatusBadge = useCallback((status: ReferralLinkUsageStatus) => {
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
  }, []);

  const isLoading = linkLoading || programLoading || usageLoading;
  const error = linkError || programError || usageError;

  const hasUsage = (usageData?.items?.length ?? 0) > 0;
  const totalCount = usageData?.totalCount ?? 0;

  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="md:max-h-[90vh] md:w-[900px]"
    >
      {link && (
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="bg-theme flex flex-row p-4 shadow-lg">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">Link Usage</h1>
              <p className="mt-1 text-sm text-white/80">{link.name}</p>
            </div>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray btn-sm"
              onClick={onClose}
            >
              <IoMdClose className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <Suspense isLoading={isLoading} error={error as any}>
              <div className="flex flex-col gap-4 overflow-y-auto">
                {/* Link Details Section */}
                {fullLinkData && (
                  <div className="space-y-2">
                    <h2 className="mb-4 flex items-center gap-4 text-base font-bold">
                      <IoLink className="inline h-6 w-6 text-blue-600" /> Your
                      Referral Link
                    </h2>
                    <LinkDetails
                      link={fullLinkData}
                      mode="large"
                      showQRCode={true}
                      showShare={true}
                    />
                  </div>
                )}

                {/* Program Preview */}
                {programData && (
                  <div className="space-y-3">
                    <div>
                      {/* Header */}
                      <div className="mb-3">
                        <h3 className="flex items-center gap-2 text-base font-bold">
                          <IoGift className="h-5 w-5 text-orange-400" />
                          Selected Program
                        </h3>
                      </div>
                      <div className="bg-white">
                        <ProgramCard program={programData} context="preview" />
                      </div>
                    </div>
                    <ProgramRequirements
                      program={programData}
                      showPathway={true}
                    />
                  </div>
                )}

                {/* Link Stats Summary */}
                <div className="space-y-2">
                  <h2 className="mb-4 flex items-center gap-4 text-base font-bold text-gray-900">
                    <IoStatsChart className="inline h-6 w-6 text-blue-600" />{" "}
                    Performance Overview
                  </h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {totalCount || 0}
                      </div>
                      <div className="text-gray-dark text-xs">
                        Total Referrals
                      </div>
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
                <div>
                  <h2 className="mb-4 flex items-center gap-4 text-base font-bold text-gray-900">
                    <IoPeople className="inline h-6 w-6 text-blue-600" />{" "}
                    Referrals ({totalCount})
                  </h2>

                  <div className="border-gray rounded-lg border">
                    {!hasUsage && (
                      <NoRowsMessage
                        title="No Referrals Yet"
                        description="When someone uses your referral link, their progress will appear here."
                        icon={"👥"}
                      />
                    )}
                    {hasUsage && (
                      <div className="space-y-3">
                        {usageData?.items?.map(
                          (usage: ReferralLinkUsageInfo) => (
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

                              {/* Proof of Personhood */}
                              {programData?.proofOfPersonhoodRequired && (
                                <div className="mb-3 flex items-center gap-2 text-xs">
                                  {usage.proofOfPersonhoodCompleted ? (
                                    <>
                                      <IoCheckmarkCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-green-600">
                                        Identity Verified
                                      </span>
                                      {usage.proofOfPersonhoodMethod && (
                                        <span className="text-gray-dark">
                                          ({usage.proofOfPersonhoodMethod})
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <IoTimeOutline className="h-4 w-4 text-yellow-600" />
                                      <span className="text-yellow-600">
                                        Identity Verification Pending
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Pathway Progress */}
                              {usage.pathway && (
                                <div className="mb-3 rounded-lg bg-gray-50 p-3">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {usage.pathway.name}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                      {usage.percentComplete}%
                                    </span>
                                  </div>
                                  <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        usage.percentComplete === 100
                                          ? "bg-green-600"
                                          : "bg-blue-500"
                                      }`}
                                      style={{
                                        width: `${usage.percentComplete}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="text-gray-dark text-xs">
                                    <span className="font-semibold">
                                      {usage.pathway.stepsCompleted}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold">
                                      {usage.pathway.stepsTotal}
                                    </span>{" "}
                                    steps completed
                                  </div>

                                  {/* Step Details */}
                                  {usage.pathway.steps &&
                                    usage.pathway.steps.length > 0 && (
                                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                                        {usage.pathway.steps.map((step) => (
                                          <div
                                            key={step.id}
                                            className="text-xs"
                                          >
                                            <div className="flex items-center gap-2">
                                              {step.completed ? (
                                                <IoCheckmarkCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                                              ) : step.tasksCompleted > 0 ? (
                                                <IoHourglassOutline className="h-4 w-4 flex-shrink-0 text-yellow-600" />
                                              ) : (
                                                <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300" />
                                              )}
                                              <span
                                                className={
                                                  step.completed
                                                    ? "font-medium text-gray-900"
                                                    : "text-gray-600"
                                                }
                                              >
                                                {step.name}
                                              </span>
                                              <span className="text-gray-dark">
                                                ({step.tasksCompleted}/
                                                {step.tasksTotal})
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              )}

                              {/* Timeline */}
                              <div className="text-gray-dark flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs">
                                <div>
                                  <span className="font-semibold">
                                    Claimed:
                                  </span>{" "}
                                  {new Date(
                                    usage.dateClaimed,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                {usage.dateCompleted && (
                                  <div className="text-green-600">
                                    <span className="font-semibold">
                                      Completed:
                                    </span>{" "}
                                    {new Date(
                                      usage.dateCompleted,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                )}
                                {usage.dateExpired && (
                                  <div className="text-red-600">
                                    <span className="font-semibold">
                                      Expired:
                                    </span>{" "}
                                    {new Date(
                                      usage.dateExpired,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
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
                          Page {currentPage} of{" "}
                          {Math.ceil(totalCount / PAGE_SIZE)}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p: number) => p + 1)}
                          disabled={
                            currentPage >= Math.ceil(totalCount / PAGE_SIZE)
                          }
                          className="btn btn-sm"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Message */}
                <FormMessage messageType={FormMessageType.Info}>
                  This shows everyone who has used your referral link and their
                  progress through the program pathway.
                </FormMessage>

                {/* Action Buttons */}
                <div className="mt-10 flex gap-3">
                  <button
                    type="button"
                    className="btn btn-outline flex-1 border-blue-600 text-blue-600 normal-case hover:bg-blue-600 hover:text-white"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      )}
    </CustomModal>
  );
};
