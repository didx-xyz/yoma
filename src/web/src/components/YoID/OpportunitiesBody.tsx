import { useState } from "react";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import Suspense from "../Common/Suspense";
import { EmptyState, FIND_OPPORTUNITIES } from "./EmptyState";
import { LineChart } from "./LineChart";
import { OpportunitiesSummary } from "./OpportunitiesSummary";
import { isPlainClick, SECTION_LINK_CLASS, SectionLink } from "./SectionLink";
import { SummaryCirclesSkeleton } from "./YoIDSkeletons";

/**
 * The Opportunities section's open body on the overview and in the user-menu drawer: the summary
 * circles or the graph, then "See graph" / "See summary" as a text link right above "Open
 * Opportunities →". The summary is always the default, whatever the data (Jason, 2026-10-26).
 * With nothing completed, pending, declined or saved there is neither: the empty state stands in
 * and the toggle goes (Jason, same day).
 */
export const OpportunitiesBody: React.FC<{
  summary: TimeIntervalSummary | undefined;
  isLoading: boolean;
  error: unknown;
  /** The overview shows the fourth, Saved, circle; the drawer has room for three. */
  showSaved?: boolean;
  /** The drawer's narrow chart. */
  forceSmall?: boolean;
  /** The drawer: close on a plain click of any link here. */
  onFollow?: () => void;
  tabIndex?: number;
}> = ({
  summary,
  isLoading,
  error,
  showSaved,
  forceSmall,
  onFollow,
  tabIndex,
}) => {
  const [graph, setGraph] = useState(false);
  const empty = !!summary && (summary.count ?? []).every((n) => !Number(n));
  const onClick =
    onFollow &&
    ((e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isPlainClick(e)) onFollow();
    });

  return (
    <>
      <Suspense
        isLoading={isLoading}
        error={error}
        loader={<SummaryCirclesSkeleton />}
      >
        {empty ? (
          <EmptyState
            title="No opportunities yet"
            description="Save one for later or complete one, and it shows up here."
            action={FIND_OPPORTUNITIES}
            onClick={onClick}
            tabIndex={tabIndex}
          />
        ) : graph && summary ? (
          <LineChart data={summary} forceSmall={forceSmall} onClick={onClick} />
        ) : (
          <OpportunitiesSummary
            data={summary}
            showSaved={showSaved}
            onClick={onClick}
          />
        )}
      </Suspense>
      {/* one row: the way to the section first, then the view toggle (Jason, 2026-10-22) */}
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <SectionLink
          id="opportunities"
          onFollow={onFollow}
          tabIndex={tabIndex}
        />
        {summary && !empty && (
          <button
            type="button"
            className={SECTION_LINK_CLASS}
            onClick={() => setGraph(!graph)}
            tabIndex={tabIndex}
          >
            See {graph ? "summary" : "graph"}
          </button>
        )}
      </div>
    </>
  );
};
