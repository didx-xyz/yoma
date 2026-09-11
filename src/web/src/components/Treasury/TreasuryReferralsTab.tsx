import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ProgramStatus,
  type Program,
  type ProgramSearchFilterAdmin,
} from "~/api/models/referrals";
import type { TreasuryInfo } from "~/api/models/treasury";
import { BTN_SECONDARY } from "~/components/Common/buttonStyles";
import { ListPagePagination } from "~/components/Common/ListPage/ListPageResults";
import { ListPageSearchToolbar } from "~/components/Common/ListPage/ListPageSearchToolbar";
import NoRowsMessage from "~/components/NoRowsMessage";
import ReferralProgramRewardSummaryRow from "~/components/Referrals/Rewards/ReferralProgramRewardSummaryRow";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { useReferralProgramsAdminQuery } from "~/hooks/useReferralProgramMutations";
import { PAGE_SIZE } from "~/lib/constants";

/**
 * Treasury → Referrals: what each referral programme can award, and what the Treasury's
 * financial-year pool actually lets it pay right now. The second branch of the hierarchy
 * (Treasury → Referral Program → Referral Link), alongside Treasury → Organisation → Opportunity.
 *
 * ⚠️ **ZLTO, not USD.** Referral rewards are capped by the Treasury's *ZLTO reward* pool. The USD
 * payout pool funds youth payouts and has nothing to do with this tab — showing it here would be the
 * money error this feature exists to prevent.
 *
 * ⚠️ SCOPES DO NOT MATCH ON THIS TAB, BY DESIGN. A programme's pool, awarded and balance are
 * **lifetime** and are never reset; the Treasury balance folded into "Payable per completion" is
 * **current financial year** and is zeroed on rollover. Both carry their scope on the label.
 *
 * Editing happens on the programme itself: the pool sits inside a five-step wizard with cross-field
 * rules (a pool must cover the ambassador + referee rewards, rewards require a completion cap and a
 * gate), so there is no safe single-field dialog to lift out of it the way there was for an
 * organisation. The row links to the programme instead.
 *
 * NB: like the sibling tabs, search and paging are component state rather than querystring params —
 * the `?tab=` param already owns this url.
 */

/** Rows are built from the admin search payload, which returns the full `Program`. */
export const TreasuryReferralsTab: React.FC<{ treasury: TreasuryInfo }> = ({
  treasury,
}) => {
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const searchFilter = useMemo<ProgramSearchFilterAdmin>(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      valueContains: search.length > 2 ? search : null,
      countries: null,
      // Active only: this tab is about capacity being consumed now. Inactive and expired programmes
      // keep their lifetime totals but cannot award anything.
      //
      // NB: the enum **name**, not `ProgramStatus.Active.toString()`. The server binds this to a C#
      // enum; a numeric string parses correctly today only because the TS and C# ordinals happen to
      // match, which reordering either enum would silently break. Same fix as the sibling tabs.
      statuses: [ProgramStatus[ProgramStatus.Active]],
      dateStart: null,
      dateEnd: null,
    }),
    [pageNumber, search],
  );

  const {
    data: results,
    isLoading,
    error: queryError,
    isPlaceholderData: isShowingPreviousResults,
  } = useReferralProgramsAdminQuery(
    searchFilter,
    `treasury_${searchFilter.valueContains ?? ""}_${pageNumber}`,
  );

  const items: Program[] = results?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="shadow-custom flex flex-col gap-1 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">Referral programmes</h5>
        <p className="text-gray-dark text-sm">
          What each active referral programme can award, and what a completion
          would pay right now. Programme pools are lifetime totals and are never
          reset; the Treasury pool they draw from resets when the financial year
          rolls over.
        </p>
      </div>

      <ListPageSearchToolbar
        defaultValue={search}
        placeholder="Search referral programmes..."
        onSearch={(query) => {
          setSearch(query);
          setPageNumber(1);
        }}
      />

      {/* ERROR */}
      {!!queryError && (
        <div className="shadow-custom flex flex-col items-center rounded-lg bg-white p-8">
          <ApiErrors error={queryError} />
        </div>
      )}

      {/* LOADING — first load only */}
      {isLoading && !queryError && (
        <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8">
          <LoadingSkeleton rows={3} />
        </div>
      )}

      {/* NO ROWS */}
      {!isLoading && !queryError && items.length === 0 && (
        <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
          <NoRowsMessage
            title={"No referral programmes found"}
            description={
              search
                ? "Please try refining your search."
                : "Active referral programmes will show here once they exist."
            }
          />
        </div>
      )}

      {/* RESULTS */}
      {!isLoading && !queryError && items.length > 0 && (
        <div
          className={`flex flex-col gap-3 transition-opacity ${isShowingPreviousResults ? "opacity-50" : ""}`}
        >
          {items.map((program) => (
            <ReferralProgramRewardSummaryRow
              key={program.id}
              name={program.name}
              imageURL={program.imageURL}
              figures={program}
              treasury={treasury}
              action={
                <Link
                  href={`/admin/referrals/${program.id}/info`}
                  className={`${BTN_SECONDARY} !min-w-0 !px-3`}
                >
                  View
                </Link>
              }
            />
          ))}

          <ListPagePagination
            currentPage={pageNumber}
            totalItems={results?.totalCount ?? 0}
            pageSize={PAGE_SIZE}
            onClick={(page) => setPageNumber(page)}
            isShowingPreviousResults={isShowingPreviousResults}
          />
        </div>
      )}
    </div>
  );
};

export default TreasuryReferralsTab;
