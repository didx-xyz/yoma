import { useEffect, useMemo, useState } from "react";
import Chart from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { useAtomValue } from "jotai";
import { screenWidthAtom } from "~/lib/store";
import NoRowsMessage from "~/components/NoRowsMessage";
import { FcAreaChart } from "react-icons/fc";

export const LineChartCumulativeCompletions: React.FC<{
  key: string;
  data: TimeIntervalSummary | undefined;
}> = ({ key, data }) => {
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

    const labels = data.legend.map((x, i) => {
      const truncatedLegend = x.length > 10 ? x.substring(0, 10) + "..." : x;
      return `${truncatedLegend} (Total: ${data.count[i]})`;
    });

    const allSameDate = mappedData.every(
      (item, _, arr) => item[0] === (arr[0]?.[0] ?? undefined),
    );
    //setShowLabels(!allSameDate);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
  }, [data]);

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [keyState, setkey] = useState(key);
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`${key}-${screenWidth}`);
  }, [screenWidth]);

  return (
    <div className="flex w-full flex-col justify-between overflow-hidden rounded-lg bg-white px-1 shadow">
      {/* <div className="ml-3 flex flex-row items-center gap-2">
        <div className="rounded-lg bg-green-light p-1">
          <FcAreaChart className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold">Cumulative Completions</div>
      </div> */}

      {showLabels ? (
        <div>
          <Chart
            key={keyState}
            chartType="AreaChart"
            loader={
              <div className="mt-20 flex w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-green"></span>
              </div>
            }
            data={localData}
            options={{
              legend: { position: "top" },
              lineWidth: 1,
              areaOpacity: 0.1,
              curveType: "function",
              title: "",
              pointSize: 2,
              pointShape: "circle",
              enableInteractivity: true,
              height: 380,
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
                width: "95%",
              },
            }}
          />
        </div>
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
