import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Status,
  type OpportunityInfo,
  type OpportunitySearchFilterAdmin,
  type OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import {
  OrganizationStatus,
  type OrganizationInfoAdmin,
  type OrganizationSearchFilter,
  type OrganizationSearchResults,
} from "~/api/models/organisation";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import { getOrganisations } from "~/api/services/organisations";
import { BTN_SECONDARY } from "~/components/Common/buttonStyles";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { ListPagePagination } from "~/components/Common/ListPage/ListPageResults";
import { ListPageSearchToolbar } from "~/components/Common/ListPage/ListPageSearchToolbar";
import OpportunityRewardSummaryRow from "~/components/Opportunity/Rewards/OpportunityRewardSummaryRow";
import OrganizationRewardSummaryRow from "~/components/Organisation/Rewards/OrganizationRewardSummaryRow";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { ORGANIZATION_REWARD_QUERY_KEYS } from "~/hooks/useOrganizationRewardMutations";
import { PAGE_SIZE } from "~/lib/constants";

/**
 * Treasury → Opportunities: where an organisation's reward capacity is actually being spent, rolled
 * up under the organisation it draws from. The level below Organisation in the hierarchy
 * (Treasury → Organisation → Opportunity).
 *
 * ⚠️⚠️ **THIS TAB IS TEMPORARY** (owner, 2026-08-06). It will most likely be **merged into the
 * Organisations tab** — an organisation row expanding to show the opportunities drawing from its
 * pools — rather than staying a sibling tab that repeats the organisation heading for every page of
 * results. Treat the layout here as a placeholder, not a settled design:
 *   • the *components* are the durable part (`OpportunityRewardSummaryRow`,
 *     `OrganizationRewardSummaryRow`), and both are already prop-driven, so they move as-is;
 *   • this file's grouping, paging and search are what would be discarded.
 * Do not build anything new on top of this tab's structure, and do not invest in polishing it.
 *
 * ⚠️ SCOPES DO NOT MATCH ACROSS THIS TAB, BY DESIGN. The organisation heading is
 * **current-financial-year** (pool / remaining, reset on rollover); every opportunity row under it is
 * **lifetime** (awarded all-time, never reset). Both carry their scope in the label. Do not "tidy"
 * this into one scope — the figures genuinely have different lifetimes.
 *
 * ⚠️ API GAP (verified 2026-08-05, recorded in T3's session log): no list endpoint returns an
 * opportunity's own reward *pool* or *balance*.
 *   • `POST /opportunity/search/admin` returns `OpportunityInfo`, which has the per-completion reward
 *     and the lifetime cumulative but no pool, and no organisation reward fields at all.
 *   • `OpportunityItem` does carry the six `Organization…CurrentFinancialYear` fields, but every
 *     reward field on it is `[JsonIgnore]` (`OpportunityItem.cs:34-92`), so they never reach the
 *     client — and it is only returned by the lightweight picker
 *     `POST /opportunity/search/filter/opportunity` anyway.
 * So the rows show what the API exposes; per-opportunity pool/remaining are visible only on the
 * opportunity's own detail page. Do not synthesise them here.
 */

/** Organisations are fetched for exactly the ids present on the current opportunity page. */
const useOrganisationsById = (organizationIds: string[], enabled: boolean) => {
  const filter = useMemo<OrganizationSearchFilter>(
    () => ({
      pageNumber: 1,
      // one page, sized to the ids we actually need
      pageSize: Math.max(organizationIds.length, 1),
      valueContains: null,
      statuses: [OrganizationStatus[OrganizationStatus.Active]],
      organizations: organizationIds,
    }),
    [organizationIds],
  );

  return useQuery<OrganizationSearchResults>({
    // shares the "Organisations" prefix, so saving a pool anywhere refreshes these headings too
    queryKey: ORGANIZATION_REWARD_QUERY_KEYS.list(
      `treasury_opportunities_${[...organizationIds].sort((a, b) => a.localeCompare(b)).join("_")}`,
    ),
    queryFn: () => getOrganisations(filter),
    enabled: enabled && organizationIds.length > 0,
  });
};

interface OrganisationGroup {
  id: string;
  name: string;
  logoURL: string | null;
  figures: OrganizationInfoAdmin | null;
  opportunities: OpportunityInfo[];
}

export const TreasuryOpportunitiesTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const searchFilter = useMemo<OpportunitySearchFilterAdmin>(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      valueContains: search.length > 2 ? search : null,
      // Active only: this tab is about capacity being consumed now. Archived and inactive
      // opportunities keep their lifetime totals but cannot draw from a pool any more.
      //
      // NB: the enum **name**, not `Status.Active.toString()`. The server binds this to a C# enum;
      // a numeric string parses correctly today only because the TS and C# ordinals happen to
      // match, which reordering either enum would silently break.
      statuses: [Status[Status.Active]],
      types: null,
      categories: null,
      languages: null,
      countries: null,
      organizations: null,
      engagementTypes: null,
      featured: null,
      startDate: null,
      endDate: null,
    }),
    [pageNumber, search],
  );

  const {
    data: results,
    isLoading,
    error: queryError,
    isPlaceholderData: isShowingPreviousResults,
  } = useQuery<OpportunitySearchResultsInfo>({
    queryKey: [
      "Treasury",
      "Opportunities",
      searchFilter.valueContains ?? "",
      pageNumber,
    ],
    queryFn: () => getOpportunitiesAdmin(searchFilter),
    placeholderData: keepPreviousData,
  });

  /** Memoised so the grouping and the id list below don't recompute on every render. */
  const items = useMemo(() => results?.items ?? [], [results]);

  /** Distinct organisation ids on this page — stable, so the org query key is stable. */
  const organizationIds = useMemo(
    () =>
      [...new Set(items.map((item) => item.organizationId))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );

  const {
    data: organisations,
    isLoading: isLoadingOrganisations,
    error: organisationsError,
  } = useOrganisationsById(organizationIds, !isLoading && !queryError);

  /** Opportunities grouped under their organisation, ordered by organisation name. */
  const groups = useMemo<OrganisationGroup[]>(() => {
    const figuresById = new Map(
      (organisations?.items ?? []).map((organisation) => [
        organisation.id,
        organisation,
      ]),
    );

    const byId = new Map<string, OrganisationGroup>();
    for (const item of items) {
      let group = byId.get(item.organizationId);
      if (!group) {
        group = {
          id: item.organizationId,
          name: item.organizationName,
          logoURL: item.organizationLogoURL,
          figures: figuresById.get(item.organizationId) ?? null,
          opportunities: [],
        };
        byId.set(item.organizationId, group);
      }
      group.opportunities.push(item);
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, organisations]);

  return (
    <div className="flex flex-col gap-4">
      <div className="shadow-custom flex flex-col gap-1 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">Opportunities</h5>
        <p className="text-gray-dark text-sm">
          What each active opportunity has awarded all-time, under the
          organisation whose financial-year pools it draws from. Opportunity
          totals are never reset; organisation pools reset when the financial
          year rolls over.
        </p>
      </div>

      {/* ⚠️ TEMPORARY — see the note at the top of this file. Remove with the tab when this view
          folds into Organisations. Dev builds only, like the ?mock= aid. */}
      {process.env.NODE_ENV !== "production" && (
        <FormMessage messageType={FormMessageType.Info}>
          This view is provisional and will likely be folded into the
          Organisations tab.
        </FormMessage>
      )}

      <ListPageSearchToolbar
        defaultValue={search}
        placeholder="Search opportunities..."
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
            title={"No opportunities found"}
            description={
              search
                ? "Please try refining your search."
                : "Active opportunities will show here once they exist."
            }
          />
        </div>
      )}

      {/* RESULTS */}
      {!isLoading && !queryError && items.length > 0 && (
        <div
          className={`flex flex-col gap-6 transition-opacity ${isShowingPreviousResults ? "opacity-50" : ""}`}
        >
          {/* The organisation headings come from a second request; say so rather than
              rendering a capacity figure that is silently missing. */}
          {!!organisationsError && (
            <FormMessage messageType={FormMessageType.Warning}>
              The organisation pools for this financial year couldn&apos;t be
              loaded, so only the opportunity totals are shown.
            </FormMessage>
          )}

          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              {group.figures ? (
                <OrganizationRewardSummaryRow
                  name={group.name}
                  logoURL={group.logoURL}
                  figures={group.figures}
                  action={
                    <Link
                      href={`/organisations/${group.id}/edit`}
                      className={`${BTN_SECONDARY} !min-w-0 !px-3`}
                    >
                      Edit pools
                    </Link>
                  }
                />
              ) : (
                <div className="flex flex-row items-center gap-2 px-1">
                  <h6 className="grow text-sm font-semibold">{group.name}</h6>
                  {isLoadingOrganisations && (
                    <span className="text-xs text-gray-500 italic">
                      loading pools…
                    </span>
                  )}
                </div>
              )}

              {/* Indented under the organisation, so the hierarchy is visible rather than implied. */}
              <div className="flex flex-col gap-2 md:pl-6">
                {group.opportunities.map((opportunity) => (
                  <OpportunityRewardSummaryRow
                    key={opportunity.id}
                    title={opportunity.title}
                    figures={opportunity}
                    action={
                      <Link
                        href={`/organisations/${group.id}/opportunities/${opportunity.id}/info`}
                        className={`${BTN_SECONDARY} !min-w-0 !px-3`}
                      >
                        View
                      </Link>
                    }
                  />
                ))}
              </div>
            </div>
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

export default TreasuryOpportunitiesTab;
