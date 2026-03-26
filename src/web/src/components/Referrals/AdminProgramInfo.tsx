import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import { useCallback, useMemo, useState } from "react";
import { IoMdCopy } from "react-icons/io";
import {
  IoEyeOffOutline,
  IoGitNetwork,
  IoPersonCircle,
  IoShareOutline,
  IoStarOutline,
} from "react-icons/io5";
import Moment from "react-moment";
import { toast } from "react-toastify";
import type { Opportunity } from "~/api/models/opportunity";
import {
  PathwayCompletionRule,
  PathwayTaskEntityType,
  Program,
  ProgramLinkReferrer,
  ProgramPathwayInfo,
} from "~/api/models/referrals";
import { getOrCreateReferralProgramReferrerLink } from "~/api/services/referrals";
import { useReferralProgramAnalyticsQuery } from "~/hooks/useReferralProgramMutations";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { ProgramStatusBadge } from "./ProgramStatusBadge";
import { ReferralTasksCard } from "./ReferralTasksCard";
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import { LoadingInline } from "../Status/LoadingInline";
import { AdminProgramShareModal } from "./AdminProgramShareModal";
import { ProgramCard } from "./ProgramCard";

export enum ProgramInfoFilterOptions {
  PREVIEW = "preview",
  PROGRAM_INFO = "programInfo",
  COMPLETION_REWARDS = "completionRewards",
  ZLTO_REWARDS = "zltoRewards",
  FEATURES = "features",
  PATHWAY = "pathway",
  AUDIT_INFO = "auditInfo",
  ANALYTICS = "analytics",
}

interface AdminProgramInfoProps {
  program: Program;
  filterOptions?: ProgramInfoFilterOptions[];
  isExpanded?: boolean;
  imagePreviewUrl?: string | null;
  opportunityDataMap?: Record<string, Opportunity>;
}

export const AdminProgramInfo: React.FC<AdminProgramInfoProps> = ({
  program,
  filterOptions = [
    ProgramInfoFilterOptions.PREVIEW,
    ProgramInfoFilterOptions.PROGRAM_INFO,
    ProgramInfoFilterOptions.COMPLETION_REWARDS,
    ProgramInfoFilterOptions.FEATURES,
    ProgramInfoFilterOptions.PATHWAY,
    ProgramInfoFilterOptions.AUDIT_INFO,
  ],
  opportunityDataMap,
}) => {
  const [programLink, setProgramLink] = useState<ProgramLinkReferrer | null>(
    null,
  );
  const [isProgramLinkLoading, setIsProgramLinkLoading] = useState(false);
  const [isProgramLinkModalOpen, setIsProgramLinkModalOpen] = useState(false);

  const { data: analytics } = useReferralProgramAnalyticsQuery(
    program?.id ?? "",
    {
      enabled:
        filterOptions?.includes(ProgramInfoFilterOptions.ANALYTICS) &&
        !!program?.id,
    },
  );
  const countriesLabel = useMemo(() => {
    const countries = program?.countries;
    if (!countries || !Array.isArray(countries) || countries.length === 0) {
      return "N/A";
    }

    // Backend returns lookup objects; admin form may store IDs (string[]).
    if (typeof countries[0] === "string") {
      return (countries as string[]).join(", ");
    }

    return (countries as any[])
      .map((c) => c?.name)
      .filter(Boolean)
      .join(", ");
  }, [program?.countries]);

  const formatCount = (value: number | null | undefined, fallback = "0") => {
    if (value === null || value === undefined) return fallback;
    return value.toLocaleString("en-US");
  };

  const renderZltoAmount = (
    value: number | null | undefined,
    fallback = "N/A",
    valueClassName = "font-semibold",
  ) => {
    if (value === null || value === undefined) {
      return fallback;
    }

    return (
      <div className="flex items-center gap-1">
        <Image
          src={iconZlto}
          alt="Zlto"
          width={16}
          height={16}
          className="h-auto"
        />
        <span className={valueClassName}>{formatCount(value)}</span>
      </div>
    );
  };

  // Ensure we always have a data map that includes the opportunity objects already
  // embedded on the program pathway tasks (these carry isCompletable/nonCompletableReason).
  const hydratedOpportunityDataMap = useMemo(() => {
    const merged: Record<string, Opportunity> = {
      ...(opportunityDataMap ?? {}),
    };

    const steps = program?.pathway?.steps ?? [];
    for (const step of steps) {
      const tasks = step?.tasks ?? [];
      for (const task of tasks) {
        const opp = task?.opportunity as Opportunity | null;
        if (!opp?.id) continue;

        const taskIsCompletable = (task as any)?.isCompletable;
        const taskNonCompletableReason = (task as any)?.nonCompletableReason;

        // The program payload already contains the authoritative opportunity flags
        // (isCompletable/nonCompletableReason). Ensure those win over any cached map entry.
        merged[opp.id] = {
          ...(merged[opp.id] ?? ({} as Opportunity)),
          ...opp,
          ...(typeof taskIsCompletable === "boolean"
            ? { isCompletable: taskIsCompletable }
            : null),
          ...(typeof taskNonCompletableReason === "string" &&
          taskNonCompletableReason.length > 0
            ? { nonCompletableReason: taskNonCompletableReason }
            : taskNonCompletableReason === null
              ? { nonCompletableReason: null }
              : null),
        };
      }
    }

    return merged;
  }, [opportunityDataMap, program?.pathway?.steps]);

  // Map ProgramPathway to ProgramPathwayInfo for preview display
  const pathwayInfo = useMemo((): ProgramPathwayInfo | null => {
    if (!program.pathway) return null;

    const steps =
      program.pathway.steps?.map((step) => {
        const tasks =
          step.tasks?.map((task) => {
            const oppId = task.opportunity?.id || (task as any).entityId;
            const oppData = oppId ? hydratedOpportunityDataMap?.[oppId] : null;

            const taskIsCompletable = (task as any)?.isCompletable;
            const taskNonCompletableReason = (task as any)
              ?.nonCompletableReason;

            const isCompletable =
              (typeof taskIsCompletable === "boolean"
                ? taskIsCompletable
                : undefined) ??
              (task.opportunity as any)?.isCompletable ??
              (oppData as any)?.isCompletable ??
              true;
            const nonCompletableReason =
              taskNonCompletableReason ??
              (task.opportunity as any)?.nonCompletableReason ??
              (oppData as any)?.nonCompletableReason ??
              null;

            const opportunity = task.opportunity
              ? ({
                  ...(task.opportunity as any),
                  isCompletable,
                  nonCompletableReason,
                } as any)
              : oppId
                ? ({
                    id: oppId,
                    title: oppData?.title || "Selected Opportunity",
                    isCompletable,
                    nonCompletableReason,
                  } as any)
                : null;

            return {
              id: task.id,
              entityType: task.entityType as PathwayTaskEntityType,
              opportunity,
              order: task.order,
              orderDisplay: task.orderDisplay ?? 0,
              completed: null,
              isCompletable,
              nonCompletableReason,
            };
          }) ?? [];

        // Step is completable if all its tasks are completable
        const stepIsCompletable = tasks.every((t) => t.isCompletable !== false);

        return {
          id: step.id,
          name: step.name,
          description: step.description ?? null,
          rule: step.rule as PathwayCompletionRule,
          orderMode: step.orderMode ?? null,
          order: step.order,
          orderDisplay: step.orderDisplay ?? null,
          completed: null,
          isCompletable: stepIsCompletable,
          tasks,
        };
      }) ?? [];

    // Pathway is completable if all steps are completable
    const pathwayIsCompletable = steps.every((s) => s.isCompletable !== false);

    return {
      id: program.pathway.id,
      name: program.pathway.name,
      description: program.pathway.description ?? null,
      rule: program.pathway.rule as PathwayCompletionRule,
      orderMode: program.pathway.orderMode ?? null,
      isCompletable: pathwayIsCompletable,
      steps,
    };
  }, [program.pathway, hydratedOpportunityDataMap]);

  const currentProgramLink = useMemo<ProgramLinkReferrer | null>(() => {
    if (programLink?.shortUrl) {
      return programLink;
    }

    if (!program?.referrerShortURL) {
      return null;
    }

    return {
      id: program.id,
      url: "",
      shortUrl: program.referrerShortURL,
      qrCodeBase64: null,
    };
  }, [program.id, program.referrerShortURL, programLink]);

  const loadProgramReferrerLink = useCallback(
    async (includeQRCode = false) => {
      setIsProgramLinkLoading(true);
      try {
        const link = await getOrCreateReferralProgramReferrerLink(
          program.id,
          includeQRCode,
        );
        setProgramLink(link);
        return link;
      } catch (error) {
        console.error("Failed to load program referrer link:", error);
        toast.error("Failed to load program referrer link");
        return null;
      } finally {
        setIsProgramLinkLoading(false);
      }
    },
    [program.id],
  );

  const handleOpenProgramLink = useCallback(async () => {
    const link = currentProgramLink ?? (await loadProgramReferrerLink(false));
    if (!link) return;
    setProgramLink((previous) => previous ?? link);
    setIsProgramLinkModalOpen(true);
  }, [currentProgramLink, loadProgramReferrerLink]);

  const handleCopyProgramLink = useCallback(async () => {
    const link = currentProgramLink ?? (await loadProgramReferrerLink(false));
    if (!link?.shortUrl) return;

    try {
      await navigator.clipboard.writeText(link.shortUrl);
      toast.success("Link copied to clipboard!", { autoClose: 2000 });
    } catch {
      toast.error("Failed to copy link");
    }
  }, [currentProgramLink, loadProgramReferrerLink]);

  return (
    <div className="space-y-6">
      {/* Preview */}
      {filterOptions?.includes(ProgramInfoFilterOptions.PROGRAM_INFO) && (
        <div className="flex flex-col gap-2">
          <h6 className="text-sm font-bold">Search Results</h6>

          <FormMessage messageType={FormMessageType.Info}>
            This is how your program will appear in search results.
          </FormMessage>

          <div className="mt-4 flex justify-center">
            <ProgramCard
              data={{
                ...program,
                name: program.name || "Program Name",
                description: program.description || "No description provided",
                imageURL: program.imageURL,
              }}
              zltoReward={program.zltoRewardReferrer}
              variant="referral"
            />
          </div>
        </div>
      )}
      {/* Program Information */}
      {filterOptions?.includes(ProgramInfoFilterOptions.PROGRAM_INFO) && (
        <section>
          <h6 className="mb-2 text-sm font-semibold">Program Information</h6>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Status
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.status ? (
                    <ProgramStatusBadge status={program.status} />
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Start Date
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.dateStart ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateStart}
                    </Moment>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  End Date
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.dateEnd ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateEnd}
                    </Moment>
                  ) : (
                    "No end date"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Countries
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {countriesLabel}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col border border-gray-200 md:flex-row">
                  <div className="w-full border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 md:w-40 md:shrink-0 md:border-r md:border-b-0">
                    Referrer Link
                  </div>
                  <div className="flex-1 px-4 py-3 text-xs">
                    {isProgramLinkLoading ? (
                      <LoadingInline
                        className="justify-start"
                        classNameSpinner="h-5 w-5 border-green"
                        classNameLabel="text-xs text-gray-500"
                        label="Preparing program referrer link..."
                      />
                    ) : (
                      <>
                        {currentProgramLink?.shortUrl ? (
                          <div className="flex max-w-full flex-col gap-3 md:max-w-[32rem]">
                            <div className="text-xs text-gray-500">
                              Share this program with ambassadors:
                            </div>

                            <div className="flex min-w-0 flex-col gap-2">
                              <div className="relative min-w-0 flex-1">
                                <input
                                  type="text"
                                  value={currentProgramLink.shortUrl}
                                  readOnly
                                  className="border-green w-full truncate rounded border border-dashed bg-white px-2 py-1.5 font-mono text-[11px] font-semibold text-gray-900 focus:outline-none"
                                  onClick={(e) => e.currentTarget.select()}
                                />
                              </div>
                              <div className="flex w-full flex-col gap-2 sm:max-w-[14rem] sm:flex-row">
                                <button
                                  type="button"
                                  onClick={handleCopyProgramLink}
                                  className="btn btn-xs bg-green w-full justify-center border-0 text-white normal-case hover:brightness-110 sm:flex-1"
                                  title="Copy short link"
                                >
                                  <IoMdCopy className="h-3 w-3" />
                                  <span className="text-[10px]">Copy</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs bg-green w-full justify-center border-0 text-white normal-case hover:brightness-110 sm:flex-1"
                                  onClick={handleOpenProgramLink}
                                  title="Share link"
                                >
                                  <IoShareOutline className="h-3 w-3" />
                                  <span className="text-[10px]">Share</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex max-w-full flex-col gap-3 md:max-w-[32rem]">
                            <div className="text-xs text-gray-500">
                              Generate a link to share this program with
                              ambassadors:
                            </div>
                            <button
                              type="button"
                              className="btn btn-xs bg-green w-full justify-center border-0 text-white normal-case hover:brightness-110 sm:max-w-[14rem]"
                              onClick={handleOpenProgramLink}
                            >
                              Generate Link
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Completion & Rewards */}
      {filterOptions?.includes(ProgramInfoFilterOptions.COMPLETION_REWARDS) && (
        <section>
          <h6 className="mb-2 text-sm font-semibold">Completion & Rewards</h6>

          <div className="space-y-4">
            <div>
              <h6 className="mb-2 text-sm font-semibold text-gray-700">
                Ambassadors
              </h6>

              <div className="overflow-x-auto">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                    Max Ambassadors
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Cap
                      </div>
                      <div className="text-sm">
                        {program?.referrerLimit ?? "No limit"}
                      </div>
                    </div>
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Active
                      </div>
                      <div className="text-sm">
                        {formatCount(program?.referrerTotal)}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-500">
                        Remaining
                      </div>
                      <div className="text-sm">
                        {program?.referrerLimit !== null &&
                        program?.referrerLimit !== undefined
                          ? formatCount(
                              program.referrerLimit -
                                (program.referrerTotal ?? 0),
                            )
                          : "No limit"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h6 className="mb-2 text-sm font-semibold text-gray-700">
                Referees (Completions)
              </h6>

              <div className="space-y-3 overflow-x-auto">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="flex">
                    <div className="w-52 border-r border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                      Completion Window (Days)
                    </div>
                    <div className="flex-1 px-4 py-2 text-xs hover:bg-gray-100">
                      {program?.completionWindowInDays
                        ? `${program.completionWindowInDays} days`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                    Per-Ambassador Completion Cap
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Cap
                      </div>
                      <div className="text-sm">
                        {program?.completionLimitReferee ?? "No limit"}
                      </div>
                    </div>
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Completed
                      </div>
                      <div className="text-sm">
                        {formatCount(program?.completionTotal)}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-500">
                        Remaining
                      </div>
                      <div className="text-sm">
                        {program?.completionLimitReferee !== null &&
                        program?.completionLimitReferee !== undefined
                          ? formatCount(
                              program.completionLimitReferee -
                                (program?.completionTotal ?? 0),
                            )
                          : "No limit"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                    Per-Program Completion Cap
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Cap
                      </div>
                      <div className="text-sm">
                        {program?.completionLimit ?? "No limit"}
                      </div>
                    </div>
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Completed
                      </div>
                      <div className="text-sm">
                        {formatCount(program?.completionTotal)}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-500">
                        Remaining
                      </div>
                      <div className="text-sm">
                        {program?.completionBalance !== null &&
                        program?.completionBalance !== undefined
                          ? formatCount(program.completionBalance)
                          : "No limit"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h6 className="mb-2 text-sm font-semibold text-gray-700">
                ZLTO Rewards
              </h6>

              <div className="space-y-3 overflow-x-auto">
                <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                  <div className="flex">
                    <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                      Ambassador Reward
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                      {renderZltoAmount(program?.zltoRewardReferrer)}
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                      Referee Reward
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                      {renderZltoAmount(program?.zltoRewardReferee)}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                    Pool
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Total
                      </div>
                      <div className="text-sm">
                        {renderZltoAmount(program?.zltoRewardPool)}
                      </div>
                    </div>
                    <div className="border-b border-gray-200 px-4 py-3 md:border-r md:border-b-0">
                      <div className="text-xs font-medium text-gray-500">
                        Awarded
                      </div>
                      <div className="text-sm">
                        {renderZltoAmount(program?.zltoRewardCumulative, "0")}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-500">
                        Remaining
                      </div>
                      <div className="text-sm">
                        {renderZltoAmount(
                          program?.zltoRewardBalance,
                          "N/A",
                          "font-semibold text-blue-600",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {filterOptions?.includes(ProgramInfoFilterOptions.FEATURES) && (
        <section>
          <h6 className="mb-2 text-sm font-semibold">Features</h6>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Default
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.isDefault ? (
                    <div className="flex items-center gap-2">
                      <IoStarOutline className="text-green h-4 w-4" />
                      <span>Default</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Proof of Personhood
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.proofOfPersonhoodRequired ? (
                    <div className="flex items-center gap-2">
                      <IoPersonCircle className="text-green h-4 w-4" />
                      <span>Required</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </div>
              </div>

              {/* NB: FEATURE HIDDEN ON UI, SUPPORTED IN BACK-END */}
              {/* <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Multiple Links
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.multipleLinksAllowed ? (
                    <span className="font-semibold">Allowed</span>
                  ) : (
                    <span className="text-gray-400">Not allowed</span>
                  )}
                </div>
              </div> */}

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Pathway
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.pathwayRequired ? (
                    <div className="flex items-center gap-2">
                      <IoGitNetwork className="text-green h-4 w-4" />
                      <span>Required</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Hidden
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.hidden ? (
                    <div className="flex items-center gap-2">
                      <IoEyeOffOutline className="text-green h-4 w-4" />
                      <span>Hidden</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Analytics */}
      {filterOptions?.includes(ProgramInfoFilterOptions.ANALYTICS) && (
        <section>
          <h6 className="mb-2 text-sm font-semibold">Analytics</h6>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Total Ambassadors
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.referrerCount?.toLocaleString("en-US") ?? "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Total Links
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.linkCount?.toLocaleString("en-US") ?? "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Active Links
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.linkCountActive?.toLocaleString("en-US") ?? "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Avg Links / Ambassador
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.linkAveragePerReferrer != null
                    ? analytics.linkAveragePerReferrer.toFixed(2)
                    : "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Total Claims
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.usageCountTotal?.toLocaleString("en-US") ?? "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Completed Claims
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.usageCountCompleted?.toLocaleString("en-US") ??
                    "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Pending Claims
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.usageCountPending?.toLocaleString("en-US") ?? "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Expired Claims
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.usageCountExpired?.toLocaleString("en-US") ?? "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Conversion Ratio
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.conversionRatioCompletionPercentage != null
                    ? `${analytics.conversionRatioCompletionPercentage.toFixed(1)}%`
                    : "—"}
                </div>
              </div>

              <div className="flex">
                <div className="w-52 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Avg Completed / Ambassador
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {analytics?.completedUsageAveragePerReferrer != null
                    ? analytics.completedUsageAveragePerReferrer.toFixed(2)
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Audit Information - Optional */}
      {filterOptions?.includes(ProgramInfoFilterOptions.AUDIT_INFO) && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            📋 Audit Information
          </h2>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Created
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.dateCreated ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateCreated}
                    </Moment>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Created By
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.createdByUserId ?? "N/A"}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Last Modified
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.dateModified ? (
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {program.dateModified}
                    </Moment>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="flex">
                <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  Modified By
                </div>
                <div className="flex-1 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-100">
                  {program?.modifiedByUserId ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pathway */}
      {filterOptions?.includes(ProgramInfoFilterOptions.PATHWAY) && (
        <section>
          <h6 className="mb-2 text-sm font-semibold">Pathway</h6>

          <div className="overflow-x-auto">
            {pathwayInfo ? (
              <ReferralTasksCard model={pathwayInfo} preview={true} />
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-700">No pathway configured</p>
              </div>
            )}
          </div>
        </section>
      )}

      <AdminProgramShareModal
        isOpen={isProgramLinkModalOpen}
        onClose={() => setIsProgramLinkModalOpen(false)}
        programId={program.id}
        programName={program.name}
        link={currentProgramLink}
        rewardAmount={program.zltoRewardReferrer}
      />
    </div>
  );
};
