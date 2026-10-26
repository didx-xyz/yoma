import { useState } from "react";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import Suspense from "../Common/Suspense";
import { hasChartData, LineChart } from "./LineChart";
import { OpportunitiesSummary } from "./OpportunitiesSummary";
import { isPlainClick, SECTION_LINK_CLASS, SectionLink } from "./SectionLink";
import { SummaryCirclesSkeleton } from "./YoIDSkeletons";

/**
 * The Opportunities section's open body on the overview and in the user-menu drawer: the graph
 * or the summary circles, then "See summary" / "See graph" as a text link right above "Open
 * Opportunities →". The graph is the default whenever the summary can draw one; until the youth
 * picks, the choice follows the data (Jason, 2026-10-22).
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
  const [choice, setChoice] = useState<"graph" | "summary" | null>(null);
  const graph = choice ? choice === "graph" : hasChartData(summary);
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
        {graph ? (
          <LineChart
            data={summary!}
            forceSmall={forceSmall}
            onClick={onClick}
          />
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
        {summary && (
          <button
            type="button"
            className={SECTION_LINK_CLASS}
            onClick={() => setChoice(graph ? "summary" : "graph")}
            tabIndex={tabIndex}
          >
            See {graph ? "summary" : "graph"}
          </button>
        )}
      </div>
    </>
  );
};
