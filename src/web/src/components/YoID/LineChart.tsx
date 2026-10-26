import { useAtomValue } from "jotai";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEventHandler } from "react";
import Chart, { type GoogleChartWrapper } from "react-google-charts";
import { IoStatsChartOutline } from "react-icons/io5";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { screenWidthAtom } from "~/lib/store";
import NoRowsMessage from "../NoRowsMessage";
import { YOID_OPPORTUNITY_TABS } from "./yoidTabs";

/**
 * The series, in the summary's order (completed, pending, declined, saved): each takes its sub-tab's
 * label and icon and one colour token. Google Charts paints SVG attributes, so the token's value is
 * read from `:root` on the client rather than written as a hex twin of `colors.css`.
 */
const SERIES = [
  {
    tab: YOID_OPPORTUNITY_TABS[0],
    token: "green",
    className: "border-green [&>svg]:text-green",
  },
  {
    tab: YOID_OPPORTUNITY_TABS[1],
    token: "blue",
    className: "border-blue [&>svg]:text-blue",
  },
  {
    tab: YOID_OPPORTUNITY_TABS[2],
    token: "pink",
    className: "border-pink [&>svg]:text-pink",
  },
  {
    tab: YOID_OPPORTUNITY_TABS[3],
    token: "orange",
    className: "border-orange [&>svg]:text-orange",
  },
] as const;

/**
 * Whether the summary draws a chart: at least two dates with something on them. One date (or
 * none) renders the "Not enough data" note instead, so the sections default to the summary
 * circles then (Jason, 2026-10-22).
 */
export const hasChartData = (
  summary: TimeIntervalSummary | undefined,
): boolean => {
  const points = summary?.data ?? [];
  const dates = new Set(points.map((point) => String(point.date)));
  return (
    dates.size > 1 &&
    points.some((point) => point.values.some((value) => Number(value) > 0))
  );
};

export const LineChart: React.FC<{
  data: TimeIntervalSummary;
  forceSmall?: boolean;
  /** Called when a legend link is followed (the drawer closes on a plain click). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ data, forceSmall, onClick }) => {
  const [selectedLegendIndex, setSelectedLegendIndex] = useState<number | null>(
    null,
  );

  // the tokens' values, once on the client
  const [colors, setColors] = useState<string[]>([]);
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setColors(
      SERIES.map(({ token }) =>
        root.getPropertyValue(`--color-${token}`).trim(),
      ),
    );
  }, []);

  const drawable = hasChartData(data);

  const localData = useMemo<(string | number | Date)[][]>(() => {
    const labels = data.legend.map(
      (name, i) =>
        `${SERIES[i]?.tab.label ?? name} (Total: ${data.count[i] ?? 0})`,
    );
    const rows = data.data.map((point) => [
      point.date ? new Date(point.date) : "",
      ...point.values,
    ]);
    return [["Date", ...labels], ...rows];
  }, [data]);

  const handleSelect = (chartWrapper: GoogleChartWrapper) => {
    const selection = chartWrapper.getChart().getSelection();
    if (
      selection != null &&
      selection.length > 0 &&
      selection[0]?.column !== null
    ) {
      setSelectedLegendIndex(selection[0]?.column - 1);
    } else {
      setSelectedLegendIndex(null);
    }
  };

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [key, setkey] = useState("");
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`chart-${screenWidth}`);
  }, [screenWidth]);

  return (
    <div className="flex h-full flex-col">
      {/* LEGEND — one link per series to its sub-tab, underlined in the series colour */}
      <div
        className={`mb-2 flex grow flex-row justify-between ${
          forceSmall
            ? "text-xs"
            : "text-xs md:justify-normal md:gap-4 md:text-sm"
        }`}
      >
        {data.legend.map((name, index) => {
          const series = SERIES[index];
          const Icon = series?.tab.icon;
          return (
            <Link
              key={index}
              className={`flex flex-row flex-nowrap items-center gap-2 border-b-2 px-2 pb-1 text-black ${
                series?.className ?? "border-gray"
              } ${selectedLegendIndex === index ? "font-bold" : ""}`}
              href={series?.tab.url ?? YOID_OPPORTUNITY_TABS[0].url}
              onClick={onClick}
              title={series?.tab.description}
            >
              {Icon && <Icon aria-hidden className="h-4 w-4 shrink-0" />}
              <span
                className={forceSmall ? "sr-only" : "sr-only sm:not-sr-only"}
              >
                {series?.tab.label ?? name}
              </span>
              <span className="bg-gray-light rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
                {(data.count[index] ?? 0).toLocaleString()}
              </span>
            </Link>
          );
        })}
      </div>

      {drawable && colors.length ? (
        <Chart
          key={key}
          chartType="AreaChart"
          width="100%"
          height="100%"
          loader={
            <div className="flex h-full w-full items-center justify-center">
              <span className="loading loading-lg loading-spinner text-green"></span>
            </div>
          }
          data={localData}
          options={{
            legend: "none",
            lineWidth: 1,
            areaOpacity: 0.1,
            colors,
            curveType: "function",
            title: "",
            pointSize: 0,
            pointShape: "circle",
            enableInteractivity: true,
            hAxis: {
              gridlines: {
                color: "transparent",
              },
              textPosition: "out",
              format: "MMM dd",
              showTextEvery: 2,
              textStyle: {
                fontSize: 10,
              },
            },
            vAxis: {
              gridlines: {
                color: "transparent",
              },
              textPosition: "none",
              baselineColor: "transparent",
            },
            chartArea: {
              left: 0,
              top: 5,
              width: "100%",
              height: "90%",
            },
          }}
          chartEvents={[
            {
              eventName: "select",
              callback: ({ chartWrapper }) => handleSelect(chartWrapper!),
            },
          ]}
        />
      ) : (
        <div className="bg-gray-light flex h-full items-center justify-center rounded-lg">
          <NoRowsMessage
            title={"Not enough data to display."}
            description={
              "This chart will display your activities as you engage more with the system by completing opportunities etc."
            }
            icon={
              <IoStatsChartOutline aria-hidden className="text-green h-5 w-5" />
            }
          />
        </div>
      )}
    </div>
  );
};
