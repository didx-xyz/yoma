import { useAtomValue } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import {
  IoAlertCircleOutline,
  IoCheckmarkDoneOutline,
  IoEyeOutline,
  IoHourglassOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import { AvatarImage } from "~/components/AvatarImage";
import OrgAdminBadges from "~/components/Opportunity/Badges/OrgAdminBadges";
import PullSyncBadge from "~/components/Opportunity/Badges/PullSyncBadge";
import ZltoRewardBadge from "~/components/Opportunity/Badges/ZltoRewardBadge";
import {
  OpportunityActionDisplayStyle,
  OpportunityActionOptions,
  OpportunityActions,
} from "~/components/Opportunity/OpportunityActions";
import {
  getTypeConfig,
  OpportunityEngagementTypeBadge,
  OpportunityMetaTextRow,
  OpportunityOrgCountriesRow,
  OpportunityTypeBadge,
} from "~/components/Opportunity/opportunityTypeTheme";
import OpportunityRewardContext from "~/components/Opportunity/Rewards/OpportunityRewardContext";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  useOpportunityInfoQuery,
  useOrganisationByIdQuery,
} from "~/hooks/useOpportunityMutations";
import { ROLE_ADMIN } from "~/lib/constants";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl } from "~/lib/utils";
import { type User } from "~/server/auth";
import { OpportunityDetailSections } from "./OpportunityDetailSections";

/** "1 view" · "12 views" */
const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * The org-admin opportunity info page in the TABBED layout (round 7, artboard 11d; live since
 * 2026-10-01 behind the kill-switch — `info.tsx` renders this when `CUSTOM_FIELDS_ENABLED`, its
 * classic body otherwise). The public page's single-column body (`OpportunityDetailSections` —
 * the same sections) under an ADMIN header card: the status chips, the existing "Manage
 * opportunity" menu (edit, activate / deactivate, visibility, featured, delete, links …), the
 * participant figures and views, and no youth buttons. The menu rides in the sticky panel too —
 * the full panel on mobile as well (`stickyMode="full"`). The Rewards block is the last tab.
 */
export const OpportunityAdminInfo: React.FC<{
  id: string;
  opportunityId: string;
  user: User;
  error?: number;
}> = ({ id, opportunityId, user, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const headerCardRef = useRef<HTMLDivElement>(null);
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );
  const { data: opportunity } = useOpportunityInfoQuery(opportunityId, {
    enabled: !error,
  });
  const { data: organisation } = useOrganisationByIdQuery(id, {
    enabled: !error,
  });

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  const typeConfig = getTypeConfig(opportunity?.type);
  const pendingHref = `/organisations/${id}/verifications?opportunity=${opportunityId}&verificationStatus=Pending${
    returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""
  }`;

  // The existing menu — in the header card and again in the sticky panel.
  const manageOpportunity = opportunity ? (
    <OpportunityActions
      opportunity={opportunity}
      user={user}
      organizationId={id}
      returnUrl={returnUrl?.toString()}
      actionOptions={[
        OpportunityActionOptions.EDIT_DETAILS,
        OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
        OpportunityActionOptions.COPY_EXTERNAL_LINK,
        OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
        OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
        OpportunityActionOptions.MAKE_ACTIVE,
        OpportunityActionOptions.MAKE_INACTIVE,
        OpportunityActionOptions.MAKE_VISIBLE,
        OpportunityActionOptions.MAKE_HIDDEN,
        OpportunityActionOptions.MARK_FEATURED,
        OpportunityActionOptions.UNMARK_FEATURED,
        OpportunityActionOptions.DELETE,
      ]}
      disabled={currentOrganisationInactive || opportunity.status == "Deleted"}
      displayStyle={OpportunityActionDisplayStyle.BUTTON}
    />
  ) : null;

  const STAT = "flex items-center gap-1";
  const STAT_ICON = "h-4 w-4 shrink-0";

  return (
    <>
      <PageBackground />

      <div className="z-10 container mt-20 max-w-7xl px-2 py-4">
        {/* BREADCRUMB — as the existing info page */}
        <div className="inline-block w-full overflow-hidden py-4 text-sm text-ellipsis whitespace-nowrap">
          <ul className="inline">
            <li className="inline">
              <Link
                className="hover:text-gray inline font-bold text-white"
                href={getSafeUrl(
                  returnUrl?.toString(),
                  `/organisations/${opportunity?.organizationId}/opportunities`,
                )}
              >
                <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
                Opportunities
              </Link>
            </li>
            <li className="mx-2 inline font-semibold text-white"> | </li>
            <li className="inline">
              <div className="inline max-w-125 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                {opportunity?.title}
              </div>
              <LimitedFunctionalityBadge />
            </li>
          </ul>
        </div>

        {opportunity && (
          <div className="flex flex-col gap-4">
            {/* ADMIN HEADER CARD */}
            <div
              ref={headerCardRef}
              className="relative flex flex-col rounded-lg bg-white p-4 shadow-lg md:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-family-nunito line-clamp-2 text-xl font-bold text-black md:text-2xl">
                    {opportunity.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <OpportunityOrgCountriesRow data={opportunity} />
                    </div>
                    <PullSyncBadge opportunity={opportunity} />
                  </div>
                </div>
                <div className="shrink-0">
                  <AvatarImage
                    icon={opportunity.organizationLogoURL ?? null}
                    alt="Company Logo"
                    size={60}
                  />
                </div>
              </div>

              <div className="mt-4 mb-2 flex flex-col gap-2 md:my-2">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <OpportunityTypeBadge
                    data={opportunity}
                    className={typeConfig.badgeClassName}
                  />
                  <OpportunityEngagementTypeBadge
                    data={opportunity}
                    className="bg-gray-light text-gray-dark"
                  />
                  {opportunity.zltoRewardEstimate != null && (
                    <ZltoRewardBadge
                      amount={opportunity.zltoRewardEstimate}
                      showToolTips={true}
                    />
                  )}
                  <OrgAdminBadges
                    opportunity={opportunity}
                    isAdmin={user?.roles.includes(ROLE_ADMIN)}
                  />
                </div>
                <OpportunityMetaTextRow data={opportunity} />
              </div>

              <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
                {/* Right-aligned and last: its menu opens leftwards from the button, so on the
                    left edge it would run off the card (Jason, 2026-10-01). */}
                <div className="order-last flex items-center justify-end gap-2 md:ml-auto">
                  {manageOpportunity}
                </div>

                {/* The existing Participants figures (plus views), as one line */}
                <p className="text-gray-dark flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className={STAT}>
                    <IoEyeOutline className={STAT_ICON} />
                    {plural(opportunity.countViewed ?? 0, "view")}
                  </span>
                  <span className={STAT}>
                    <IoPeopleOutline className={STAT_ICON} />
                    {plural(
                      opportunity.participantCountTotal ?? 0,
                      "participant",
                    )}
                  </span>
                  {(opportunity.participantCountCompleted ?? 0) > 0 && (
                    <span className={STAT}>
                      <IoCheckmarkDoneOutline className={STAT_ICON} />
                      {`${opportunity.participantCountCompleted} completed`}
                    </span>
                  )}
                  {(opportunity.participantCountPending ?? 0) > 0 && (
                    <Link
                      href={pendingHref}
                      className={`${STAT} text-yellow font-semibold underline`}
                    >
                      <IoHourglassOutline className={STAT_ICON} />
                      {`${opportunity.participantCountPending} pending`}
                    </Link>
                  )}
                  {opportunity.participantLimit != null && (
                    <span className={STAT}>
                      <IoPersonAddOutline className={STAT_ICON} />
                      {`Limit ${opportunity.participantLimit}`}
                    </span>
                  )}
                  {opportunity.participantLimitReached && (
                    <span className={`${STAT} text-orange font-semibold`}>
                      <IoAlertCircleOutline className={STAT_ICON} />
                      Limit reached
                    </span>
                  )}
                </p>
              </div>
            </div>

            <OpportunityDetailSections
              opportunity={opportunity}
              headerRef={headerCardRef}
              barActions={manageOpportunity}
              stickyMode="full"
              showUnspecifiedIncentive
              extraGroups={
                organisation
                  ? [
                      {
                        id: "rewards",
                        label: "Rewards",
                        // the existing info page's block; its heading is the group label now
                        content: (
                          <div className="shadow-custom flex flex-col gap-3 rounded-xl bg-white p-4 md:p-6">
                            <p className="text-gray-dark text-xs">
                              What this opportunity has awarded all-time, and
                              what its organisation has left to award this
                              financial year. Pools are set by a Yoma
                              administrator.
                            </p>
                            <OpportunityRewardContext
                              own={opportunity}
                              organisation={organisation}
                              organisationName={opportunity.organizationName}
                            />
                          </div>
                        ),
                      },
                    ]
                  : []
              }
            />
          </div>
        )}
      </div>
    </>
  );
};
