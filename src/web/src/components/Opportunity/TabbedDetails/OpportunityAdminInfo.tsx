import { useAtomValue } from "jotai";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoEyeOutline, IoPeopleOutline } from "react-icons/io5";
import type { OpportunityInfo } from "~/api/models/opportunity";
import OrgAdminBadges from "~/components/Opportunity/Badges/OrgAdminBadges";
import PullSyncBadge from "~/components/Opportunity/Badges/PullSyncBadge";
import {
  OpportunityActionDisplayStyle,
  OpportunityActionOptions,
  OpportunityActions,
} from "~/components/Opportunity/OpportunityActions";
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
import {
  DetailHeaderCard,
  stripColumns,
  TILE,
  TILE_LABEL,
  TILE_VALUE,
} from "./DetailHeaderCard";
import { OpportunityDetailSections } from "./OpportunityDetailSections";

/** "1 view" · "12 views" */
const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * The participant figures as tiles (round 10), the fact strip's metrics without icons: the
 * existing strings split into value + label, each shown exactly when it was on the old line.
 * Completed and pending only when > 0 — pending is the existing link to its verifications —
 * and the limit when there is one ("Limit reached" in orange once it is hit).
 */
const AdminStatStrip: React.FC<{
  opportunity: OpportunityInfo;
  pendingHref: string;
}> = ({ opportunity, pendingHref }) => {
  const completed = opportunity.participantCountCompleted ?? 0;
  const pending = opportunity.participantCountPending ?? 0;
  const limit = opportunity.participantLimit;
  const limitReached = opportunity.participantLimitReached;

  const tiles: React.ReactNode[] = [];
  if (completed > 0)
    tiles.push(
      <div key="completed" className={`${TILE} bg-green-light`}>
        <span className={TILE_VALUE}>{completed}</span>
        <span className={TILE_LABEL}>completed</span>
      </div>,
    );
  if (pending > 0)
    tiles.push(
      <Link
        key="pending"
        href={pendingHref}
        className={`${TILE} bg-orange-light hover:bg-yellow-tint block transition-colors duration-120 motion-reduce:transition-none`}
      >
        <span className={TILE_VALUE}>{pending}</span>
        <span className={`${TILE_LABEL} underline`}>pending</span>
      </Link>,
    );
  if (limit != null || limitReached)
    tiles.push(
      <div key="limit" className={`${TILE} bg-gray-light`}>
        {limit != null && <span className={TILE_VALUE}>{limit}</span>}
        {limitReached ? (
          <span className="text-orange block text-xs font-semibold">
            Limit reached
          </span>
        ) : (
          <span className={TILE_LABEL}>limit</span>
        )}
      </div>,
    );
  if (tiles.length === 0) return null;

  return (
    <div className={`grid gap-3 ${stripColumns(tiles.length)}`}>{tiles}</div>
  );
};

/**
 * The org-admin opportunity info page in the TABBED layout (round 7, artboard 11d; live since
 * 2026-10-01 behind the kill-switch — `info.tsx` renders this when `CUSTOM_FIELDS_ENABLED`, its
 * classic body otherwise). The public page's single-column body (`OpportunityDetailSections` —
 * the same sections) under the public header card (round 10, `DetailHeaderCard`) with the ADMIN
 * pieces: the status chips on the chip row, the participant figures as a stat strip, the views
 * and participants line, the existing "Manage opportunity" menu (edit, activate / deactivate,
 * visibility, featured, delete, links …) and no youth buttons. The menu rides in the sticky
 * panel too — the full panel on mobile as well (`stickyMode="full"`). The Rewards block is the
 * last tab, a gold pill.
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
            {/* ADMIN HEADER CARD — the public card: status chips, type chip and the
                externally-managed badge on the chip row; title, logo and fact strip as public;
                the participant figures and the Manage menu instead of the youth buttons */}
            <DetailHeaderCard
              ref={headerCardRef}
              opportunity={opportunity}
              leadingChips={
                <OrgAdminBadges
                  opportunity={opportunity}
                  isAdmin={user?.roles.includes(ROLE_ADMIN)}
                />
              }
              trailingChips={<PullSyncBadge opportunity={opportunity} />}
            >
              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
                <div className="flex min-w-0 grow flex-col gap-2">
                  <AdminStatStrip
                    opportunity={opportunity}
                    pendingHref={pendingHref}
                  />
                  {/* The existing views and participants figures, as one grey line */}
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
                  </p>
                </div>

                {/* Right-aligned and last, in the DOM too (so the keyboard meets it after the
                    stats): its menu opens leftwards from the button, so on the left edge it
                    would run off the card (Jason, 2026-10-01). */}
                <div className="flex shrink-0 items-center justify-end gap-2 md:ml-auto">
                  {manageOpportunity}
                </div>
              </div>
            </DetailHeaderCard>

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
                        // a gold pill while inactive, purple like every tab when active
                        tone: "reward",
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
