import { useMemo, useEffect, useState } from "react";
import Chart from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { CHART_COLORS } from "~/lib/constants";

type VisualizationSelectionArray = {
  column?: number;
  row?: number;
}[];

const updateCustomLegendLineChart = (
  legend_div: string,
  data: TimeIntervalSummary | undefined,
  selection: VisualizationSelectionArray | undefined,
  opportunityCount: number | undefined,
) => {
  if (!data) {
    console.warn("No data for custom legend");
    return;
  }

  // Get the legend div
  const legendDiv = document.getElementById(legend_div);
  if (!legendDiv) {
    console.warn("No legendDiv for custom legend");
    return;
  }

  // Clear the current legend
  legendDiv.innerHTML = "";

  const opportunitiesDiv = document.createElement("div");
  opportunitiesDiv.classList.add("ml-4", "mt-2");
  opportunitiesDiv.innerHTML = `
    <div class="flex flex-col gap-1">
      <div class="flex flex-row gap-2 items-center">
      <span class="rounded-lg bg-green-light p-1 hidden min-[400px]:inline"><img class="w-3 h-3 md:h-5 md:w-5" src="/images/icon-skills-green.svg"/></span>
        <span class="text-xs md:text-sm font-semibold">Opportunities</span>
      </div>
      <div class="text-sm md:text-3xl font-semibold border-b-2 border-green w-fit">${opportunityCount}</div>
    </div>`;

  legendDiv.appendChild(opportunitiesDiv);

  // Add each series to the legend
  for (let i = 0; i < data.legend.length; i++) {
    // Create a div for the series
    const seriesDiv = document.createElement("div");
    seriesDiv.classList.add("ml-0");
    seriesDiv.classList.add("md:ml-4");
    seriesDiv.classList.add("mt-2");

    // Add the series name and color to the div
    switch (data.legend[i]) {
      case "Viewed":
        seriesDiv.innerHTML = `<div class="flex flex-col gap-1"><div class="flex flex-row gap-2 items-center"><span class="rounded-lg bg-green-light p-1 hidden min-[400px]:inline"><img class="w-3 h-3 md:h-5 md:w-5" src="/images/icon-views-green.svg"/></span><span class="text-xs md:text-sm font-semibold">${
          data.legend[i]
        }</span></div>
            ${
              data.count[i] != null
                ? `<div class="text-sm md:text-3xl font-semibold border-b-2 border-green w-fit">${data.count[
                    i
                  ]?.toLocaleString()}</div>`
                : ""
            }
            </div>`;
        break;

      case "Completions":
        seriesDiv.innerHTML = `<div class="flex flex-col gap-1"><div class="flex flex-row gap-2 items-center"><span class="rounded-lg bg-green-light p-1 hidden min-[400px]:inline"><img class="w-3 h-3 md:h-5 md:w-5" src="/images/icon-bookmark-green.svg"/></span><span class="text-xs md:text-sm font-semibold">${
          data.legend[i]
        }</span></div>
            ${
              data.count[i] != null
                ? `<div class="text-sm md:text-3xl font-semibold border-b-2 border-green w-fit border-dashed">${data.count[
                    i
                  ]?.toLocaleString()}</div>`
                : ""
            }
            </div>`;
        break;

      default:
        seriesDiv.innerHTML = `<div class="flex flex-col gap-1"><div class="flex flex-row gap-2 items-center"><span style="color: ${
          CHART_COLORS[i]
        }">●</span><span class="text-xs md:text-sm font-semibold">${
          data.legend[i]
        }</span></div>
            ${
              data.count[i] != null
                ? `<div class="text-sm md:text-3xl font-semibold border-b-2 border-green w-fit">${data.count[
                    i
                  ]?.toLocaleString()}</div>`
                : ""
            }
            </div>`;
    }

    // If the series is selected, add a class to the div
    if (selection && selection.length > 0 && selection[0]?.column === i) {
      seriesDiv.classList.add("selected");
    }

    // Add the div to the legend
    legendDiv.appendChild(seriesDiv);
  }
};

export const LineChart: React.FC<{
  id: string;
  data: TimeIntervalSummary | undefined;
  width: number;
  height: number;
  chartWidth?: number;
  chartHeight?: number;
  opportunityCount?: number;
}> = ({ id, data, width, height, opportunityCount }) => {
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // map the data to the format required by the chart
  const localData = useMemo<(string | number)[][]>(() => {
    if (!data) return [];

    // if no data was provided, supply empty values so that the chart does not show errors
    if (!(data?.data && data.data.length > 0))
      data.data = [
        {
          date: "",
          values: [0],
        },
      ];

    const mappedData = data.data.map((x) => {
      if (x.date) {
        const date = new Date(x.date);
        x.date = date;
      }

      return [x.date, ...x.values] as (string | number)[];
    });

    const labels = data.legend.map((x, i) => `${x} (Total: ${data.count[i]})`);

    // Check if all dates are the same and adjust label visibility
    const allSameDate = mappedData.every(
      (item, _, arr) => item[0] === (arr[0]?.[0] ?? undefined),
    );
    setShowLabels(!allSameDate);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
  }, [data]);

  const [chartSize, setChartSize] = useState({
    width: width,
    height: height,
    areaWidth: "94%",
  });

  const [responsiveHeight, setResponsiveHeight] = useState(height);

  // Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 359) {
        setResponsiveHeight(245);
        setChartSize({ width: 0, height: 0, areaWidth: "65%" });
      } else if (window.innerWidth > 359 && window.innerWidth < 390) {
        setChartSize({ width: 0, height: 0, areaWidth: "75%" });
        setResponsiveHeight(245);
      } else if (window.innerWidth >= 390 && window.innerWidth < 411) {
        setChartSize({ width: 0, height: 0, areaWidth: "81%" });
        setResponsiveHeight(245);
      } else if (window.innerWidth >= 411 && window.innerWidth < 420) {
        setChartSize({ width: 0, height: 0, areaWidth: "85%" });
        setResponsiveHeight(245);
      } else if (window.innerWidth >= 420 && window.innerWidth < 768) {
        setChartSize({ width: 0, height: 0, areaWidth: "91%" });
        setResponsiveHeight(245);
      } else {
        setChartSize({ width: width, height: height, areaWidth: "94%" });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size adjustment

    return () => window.removeEventListener("resize", handleResize);
  }, [width, height]);

  useEffect(() => {
    if (!data || !localData) return;

    // Update the custom legend when the chart is ready (ready event does not always fire)
    updateCustomLegendLineChart(
      `legend_div_${id}`,
      data,
      undefined,
      opportunityCount,
    );
  }, [id, localData, data, opportunityCount]);

  if (!localData) {
    return (
      <div className="mt-10 flex flex-grow items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg bg-white pt-4 shadow"
      style={{ height: responsiveHeight }}
    >
      <div
        id={`legend_div_${id}`}
        className="ml-0 flex flex-row gap-2 md:ml-3"
      ></div>

      <div className="ml-4 flex items-stretch justify-stretch md:ml-6">
        {showLabels ? (
          <Chart
            width={chartSize.width}
            height={chartSize.height}
            chartType="AreaChart"
            loader={
              <div className="mt-20 flex w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-green"></span>
              </div>
            }
            data={localData}
            options={{
              animation: {
                duration: 300,
                easing: "linear",
                startup: true,
              },
              legend: "none",
              lineWidth: 1,
              areaOpacity: 0.1,
              width: chartSize.width,
              height: chartSize.height,
              colors: ["#387F6A"],
              curveType: "function",
              title: "",
              pointSize: 0,
              pointShape: "circle",
              hAxis: {
                gridlines: {
                  color: "transparent",
                },
                textPosition: showLabels ? "out" : "none",
                format: "MMM dd",
                showTextEvery: 2, // Increase this number to show fewer labels
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
              series: {
                0: {},
                1: {
                  lineDashStyle: [4, 4],
                  areaOpacity: 0,
                },
              },
              chartArea: {
                // left: "3%",
                left: 0,
                top: 0,
                width: chartSize.areaWidth,
                height: "65%",
              },
            }}
            chartEvents={[
              {
                eventName: "ready",
                callback: () => {
                  // Update the custom legend when the chart is ready
                  updateCustomLegendLineChart(
                    `legend_div_${id}`,
                    data,
                    undefined,
                    opportunityCount,
                  );
                },
              },
              {
                eventName: "select",
                callback: ({ chartWrapper }) => {
                  // Update the custom legend when the selection changes
                  const selection = chartWrapper.getChart().getSelection();
                  updateCustomLegendLineChart(
                    `legend_div_${id}`,
                    data,
                    selection,
                    opportunityCount,
                  );
                },
              },
            ]}
          />
        ) : (
          <div className="mr-4 mt-10 flex w-[900px] flex-col items-center justify-center rounded-lg bg-gray-light p-8 text-center md:mr-6 md:mt-6 md:h-[15rem]">
            Not enough data to display
          </div>
        )}
      </div>
    </div>
  );
};
