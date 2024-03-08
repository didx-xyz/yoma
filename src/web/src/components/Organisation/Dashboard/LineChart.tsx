import { useMemo, useEffect } from "react";
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

  // Add each series to the legend
  for (let i = 0; i < data.legend.length; i++) {
    // Create a div for the series
    const seriesDiv = document.createElement("div");
    seriesDiv.classList.add("ml-4");
    seriesDiv.classList.add("mt-2");

    // Add the series name and color to the div
    seriesDiv.innerHTML = `<div class="flex flex-col"><div class="flex flex-row gap-2 items-center"><span style="color: ${
      CHART_COLORS[i]
    }">●</span><span class="text-sm font-semibold">${
      data.legend[i]
    }</span></div>
        ${
          data.count[i] != null
            ? `<div class="text-2xl font-bold">${data.count[i]}</div>`
            : ""
        }
        </div>`;

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
  hideAxisesAndGridLines?: boolean;
}> = ({
  id,
  data,
  width,
  height,
  chartWidth,
  chartHeight,
  hideAxisesAndGridLines,
}) => {
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
      const date = new Date(x.date);
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return [formattedDate, ...x.values] as (string | number)[];
    });

    const labels = data.legend.map((x, i) => `${x} (Total: ${data.count[i]})`);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
  }, [data]);

  useEffect(() => {
    if (!data || !localData) return;
    // Update the custom legend when the chart is ready (ready event does not always fire)
    updateCustomLegendLineChart(`legend_div_${id}`, data, undefined);
  }, [id, localData, data]);

  if (!localData) {
    return (
      <div className="mt-10 flex flex-grow items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg bg-white pt-2 shadow"
      style={{ minWidth: width, height: height }}
    >
      <div id={`legend_div_${id}`} className="flex flex-row gap-2"></div>
      <Chart
        width={chartWidth}
        height={chartHeight}
        chartType="LineChart"
        loader={
          <div className="mt-10 flex flex-grow items-center justify-center">
            Loading...
          </div>
        }
        data={localData}
        options={{
          legend: "none",
          lineWidth: 2,
          areaOpacity: 0.1,
          colors: CHART_COLORS,
          curveType: "function",
          title: "", // Remove the title from the chart itself
          pointSize: 5, // this sets the size of the data points
          pointShape: "circle", // this sets the shape of the data points
          hAxis: hideAxisesAndGridLines
            ? {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none", // Hide the labels on the horizontal axis
                baselineColor: "transparent", // Hide the baseline on the horizontal axis
              }
            : {},
          vAxis: hideAxisesAndGridLines
            ? {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none", // Hide the labels on the vertical axis
                baselineColor: "transparent", // Hide the baseline on the vertical axis
              }
            : {},
        }}
        chartEvents={[
          {
            eventName: "ready",
            callback: () => {
              // Update the custom legend when the chart is ready
              updateCustomLegendLineChart(`legend_div_${id}`, data, undefined);
            },
          },
          {
            eventName: "select",
            callback: ({ chartWrapper }) => {
              // Update the custom legend when the selection changes
              const selection = chartWrapper.getChart().getSelection();
              updateCustomLegendLineChart(`legend_div_${id}`, data, selection);
            },
          },
        ]}
      />
    </div>
  );
};
