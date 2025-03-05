import { useEffect, useMemo, useState } from "react";
import Chart, { type GoogleChartWrapper } from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import Image from "next/image";
import { useAtomValue } from "jotai";
import { screenWidthAtom } from "~/lib/store";
import NoRowsMessage from "~/components/NoRowsMessage";

export const LineChart: React.FC<{
  key: string;
  data: TimeIntervalSummary | undefined;
  opportunityCount?: number;
}> = ({ key, data, opportunityCount }) => {
  const [selectedLegendIndex, setSelectedLegendIndex] = useState<number | null>(
    null,
  );
  const [showLabels, setShowLabels] = useState<boolean>(true);

  const localData = useMemo<(string | number)[][]>(() => {
    if (!data) return [];

    if (!(data?.data && data.data.length > 0))
      data.data = [{ date: "", values: [0] }];

    const mappedData = data.data.map((x) => {
      if (x.date) {
        const date = new Date(x.date);
        x.date = date;
      }
      return [x.date, ...x.values] as (string | number)[];
    });

    const labels = data.legend.map((x, i) => `${x} (Total: ${data.count[i]})`);

    const allSameDate = mappedData.every(
      (item, _, arr) => item[0] === (arr[0]?.[0] ?? undefined),
    );
    setShowLabels(!allSameDate);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
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
  const [keyState, setkey] = useState(key);
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`${key}-${screenWidth}`);
  }, [screenWidth]);

  const Legend = () => (
    <div className="flex flex-row gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <span className="hidden rounded-lg bg-green-light p-1 min-[400px]:inline">
            🏆
          </span>
          <span className="w-14 truncate text-xs font-semibold md:w-full md:text-sm">
            Opportunities
          </span>
        </div>
        <div className="w-fit border-b-2 border-green text-sm font-semibold md:text-3xl">
          {opportunityCount?.toLocaleString()}
        </div>
      </div>
      {data?.legend.map((name, index) => (
        <div
          key={index}
          className={`flex flex-col gap-1 ${
            selectedLegendIndex === index ? "selected" : ""
          }`}
        >
          <div className="flex flex-row items-center gap-2">
            <span
              className={`hidden rounded-lg bg-green-light p-1 min-[400px]:inline`}
            >
              {name === "Viewed" && "👀"}
              {name === "Go-To Clicks" && "👆"}
              {name === "Completions" && "🎓"}
            </span>
            <span className="w-14 truncate text-xs font-semibold md:w-full md:text-sm">
              {name}
            </span>
          </div>
          {data.count[index] != null && (
            <div
              className={`w-fit border-b-2 border-green text-sm font-semibold md:text-3xl ${
                name === "Viewed" ? "border-dashed" : ""
              }`}
            >
              {data.count[index]?.toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-white p-4 shadow">
      <Legend />

      {showLabels ? (
        <Chart
          key={keyState}
          chartType="AreaChart"
          //chartVersion="50" // NB: fixes animation bug in latest verson of google charts. TODO: remove when fixed
          loader={
            <div className="mt-20 flex w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={localData}
          width="100%"
          height="100%"
          options={{
            //   animation: {
            //     duration: 300,
            //     easing: "linear",
            //     startup: true,
            //   },
            legend: "none",
            lineWidth: 1,
            areaOpacity: 0.1,
            colors: ["#387F6A"],
            curveType: "function",
            title: "",
            pointSize: 2,
            pointShape: "circle",
            enableInteractivity: true,
            hAxis: {
              gridlines: {
                color: "transparent",
              },
              textPosition: showLabels ? "out" : "none",
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
              width: "99%",
              height: "90%",
              top: 0,
            },
            series: {
              0: { lineDashStyle: [4, 4], areaOpacity: 0 },
              1: {},
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
        <div className="flex h-full items-center justify-center rounded-lg bg-gray-light">
          <NoRowsMessage
            title={"Not enough data to display."}
            description={
              "This chart will display data as more activity is recorded on the system."
            }
          />
        </div>
      )}
    </div>
  );
};
