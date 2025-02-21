import { useAtomValue } from "jotai";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Chart, { type GoogleChartWrapper } from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { screenWidthAtom } from "~/lib/store";
import NoRowsMessage from "../NoRowsMessage";

export const LineChart: React.FC<{
  data: TimeIntervalSummary;
  forceSmall?: boolean;
}> = ({ data, forceSmall }) => {
  const colors = ["#387F6A", "#4CADE9", "#FE4D57", "#F9AB3E"]; // green, blue, pink, orange

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

  const Legend = () => (
    <div
      className={`mb-2 flex flex-grow flex-row justify-between ${
        forceSmall ? "text-xs" : "text-xs md:justify-normal md:gap-4 md:text-sm"
      }`}
    >
      {data?.legend.map((name, index) => (
        <Link
          key={index}
          className={`flex flex-row flex-nowrap gap-2 border-b-2 px-2 pb-1 ${
            selectedLegendIndex === index ? "font-bold" : ""
          }`}
          style={{ borderColor: colors[index] }}
          href={`/yoid/opportunities/${name.toLowerCase()}`}
        >
          <div className="flex flex-grow items-center gap-2 whitespace-nowrap">
            <span className="">
              {name == "Completed"
                ? "✅"
                : name == "Pending"
                  ? "🕒"
                  : name == "Rejected"
                    ? "❌"
                    : name == "Saved"
                      ? "💗"
                      : "❔"}
            </span>
            <span className={`${forceSmall ? "hidden" : "hidden sm:flex"}`}>
              {name}
            </span>
          </div>
          <div className="badge badge-xs bg-gray text-black">
            {data.count[index]?.toLocaleString()}
          </div>
        </Link>
      ))}
    </div>
  );

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [key, setkey] = useState("");
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`chart-${screenWidth}`);
  }, [screenWidth]);

  return (
    <div className="flex h-full flex-col">
      <Legend />

      {showLabels ? (
        <Chart
          key={key}
          chartType="AreaChart"
          //chartVersion="50" // NB: fixes animation bug in latest verson of google charts. TODO: remove when fixed
          loader={
            <div className="flex h-full w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={localData}
          options={{
            // animation: {
            //   duration: 300,
            //   easing: "linear",
            //   startup: true,
            // },
            legend: "none",
            lineWidth: 1,
            areaOpacity: 0.1,
            colors: colors,
            curveType: "function",
            title: "",
            pointSize: 0,
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
            width: "100%" as any,
            height: "100%" as any,
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
        <div className="flex h-full items-center justify-center rounded-lg bg-gray-light">
          <NoRowsMessage
            title={"Not enough data to display."}
            description={
              "This chart will display your activities as you engage more with the system by completing opportunities etc."
            }
          />
        </div>
      )}
    </div>
  );
};
