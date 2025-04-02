import { useEffect, useMemo, useState } from "react";
import Chart from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { useAtomValue } from "jotai";
import { screenWidthAtom } from "~/lib/store";
import NoRowsMessage from "~/components/NoRowsMessage";
import { CHART_COLORS, LINE_DASH_STYLES } from "~/lib/constants";
import CustomSlider from "~/components/Carousel/CustomSlider";

export const LineChartCumulativeCompletions: React.FC<{
  key: string;
  data: TimeIntervalSummary | undefined;
}> = ({ key, data }) => {
  const [showChart, setShowChart] = useState<boolean>(true);
  const [selectedLegendIndex, setSelectedLegendIndex] = useState<number | null>(
    null,
  );

  const localData = useMemo<(string | number)[][]>(() => {
    if (!data?.data || data.data.length === 0) {
      setShowChart(false);
      return [];
    }

    const labels = data.legend.map((x, i) => {
      const truncatedLegend = x.length > 10 ? x.substring(0, 10) + "..." : x;
      return `${truncatedLegend} (Total: ${data.count[i]})`;
    });

    const mappedData = data.data.map((x) => {
      if (x.date) {
        const date = new Date(x.date);
        x.date = date;
      }

      // Ensure x.values is an array before spreading
      const values = Array.isArray(x.values) ? x.values.flat() : []; // Flatten in case of nested arrays

      return [x.date, ...values] as (string | number)[];
    });

    const allSameDate = mappedData.every(
      (item, _, arr) => item[0] === (arr[0]?.[0] ?? undefined),
    );
    setShowChart(!allSameDate);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
  }, [data, setShowChart]);

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [keyState, setkey] = useState(key);
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`${key}-${screenWidth}`);
  }, [key, screenWidth]);

  const Legend = () => (
    <>
      {data?.legend.map((name, index) => (
        <div
          key={index}
          className={`flex cursor-pointer flex-col gap-1 ${
            selectedLegendIndex === index ? "selected" : ""
          }`}
          onClick={() => {
            setSelectedLegendIndex((prevIndex) =>
              prevIndex === index ? null : index,
            );
          }}
        >
          <div className="flex flex-row items-center gap-3 select-none">
            <div className="bg-gray-light rounded-lg p-1">🏢</div>
            <div
              className="text-md tooltip tooltip-secondary max-w-20 truncate font-semibold md:max-w-36"
              data-tip={name}
            >
              {name}
            </div>
          </div>
          {data.count[index] != null && (
            <div className="select-none">
              <div
                className={`text-xl font-semibold ${
                  selectedLegendIndex === index ? "text-white" : ""
                } md:text-3xl`}
                style={{
                  color:
                    showChart && data.count[index] > 0
                      ? CHART_COLORS[index % CHART_COLORS.length]
                      : "#000",
                }}
              >
                {data.count[index]?.toLocaleString()}
              </div>
              {showChart && data.count[index] > 0 && (
                <svg height="4" width="40" className="my-1">
                  <line
                    x1="0"
                    y1="2"
                    x2="40"
                    y2="2"
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={selectedLegendIndex === index ? "4" : "2"}
                    strokeDasharray={
                      LINE_DASH_STYLES[index % LINE_DASH_STYLES.length]?.join(
                        ",",
                      ) || "none"
                    }
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );

  const series = useMemo(() => {
    const seriesOptions: { [key: string]: any } = {};
    data?.legend.forEach((_, index) => {
      seriesOptions[index] = {
        color:
          selectedLegendIndex === null || selectedLegendIndex === index
            ? CHART_COLORS[index % CHART_COLORS.length]
            : "#D3D3D3", // Light gray for deselected lines
        lineDashStyle: LINE_DASH_STYLES[index % LINE_DASH_STYLES.length],
        lineWidth: selectedLegendIndex === index ? 4 : 1,
      };
    });
    return seriesOptions;
  }, [data?.legend, selectedLegendIndex]);

  return (
    <>
      <CustomSlider sliderClassName="!md:gap-8 !gap-4">
        <Legend />
      </CustomSlider>

      {showChart ? (
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
            legend: { position: "none" },
            curveType: "function",
            pointSize: 8,
            pointShape: "circle",
            enableInteractivity: true,
            height: 380,
            isStacked: true,
            hAxis: {
              gridlines: {
                color: "transparent",
              },
              textPosition: showChart ? "out" : "none",
              format: "MMM dd",
              showTextEvery: 1,
              textStyle: {
                fontSize: 10,
              },
              // hide duplicate labels
              ticks: showChart
                ? (localData
                    .slice(1)
                    .map((row) => row[0])
                    .filter((date) => date !== undefined) as (number | Date)[])
                : [], // Use all dates as ticks
            },
            vAxis: {
              gridlines: { color: "#f5f5f5" },
              minValue: 0,
              format: "#",
              textStyle: { fontSize: 10 },
            },
            chartArea: {
              left: "40",
              right: "30",
              top: "40",
              bottom: "20",
            },
            series: series,
          }}
          chartEvents={[
            {
              eventName: "select",
              callback: ({ chartWrapper }) => {
                if (!chartWrapper) return;
                const selection = chartWrapper.getChart().getSelection();

                if (selection?.length > 0) {
                  const selectedItem = selection[0];
                  let seriesIndex = selectedItem?.column;
                  // account for the date column
                  if (seriesIndex != null) {
                    seriesIndex = seriesIndex - 1;

                    setSelectedLegendIndex((prevIndex) =>
                      prevIndex === seriesIndex ? null : seriesIndex,
                    );
                  } else {
                    setSelectedLegendIndex(null);
                  }
                } else {
                  setSelectedLegendIndex(null);
                }
              },
            },
            {
              eventName: "statechange",
              callback: ({ chartWrapper }) => {
                if (!chartWrapper) return;
                setSelectedLegendIndex(null);
              },
            },
          ]}
        />
      ) : (
        <div className="bg-gray-light flex h-full items-center justify-center rounded-lg">
          <NoRowsMessage
            title={"Not enough data to display."}
            description={
              "This chart will display data as more activity is recorded on the system."
            }
          />
        </div>
      )}
    </>
  );
};
