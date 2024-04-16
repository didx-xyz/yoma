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
    seriesDiv.classList.add("mt-4");

    // Add the series name and color to the div
    seriesDiv.innerHTML = `<div class="flex flex-col gap-4"><div class="flex flex-row gap-3 items-center"><span class="rounded-lg bg-green-light p-1"><img src="/images/icon-views-green.svg"/></span><span class="text-sm font-semibold">${
      data.legend[i]
    }</span></div>
        ${
          data.count[i] != null
            ? `<div class="text-3xl font-semibold mb-2">${data.count[
                i
              ]?.toLocaleString()}</div>`
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

export const SkillsChart: React.FC<{
  id: string;
  data: TimeIntervalSummary | undefined;
}> = ({ id, data }) => {
  const [showChart, setShowChart] = useState<boolean>(true);
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
    setShowChart(!allSameDate);

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
    <div className="h-44 w-full overflow-hidden rounded-lg bg-white shadow md:w-[275px]">
      <div id={`legend_div_${id}`} className="flex flex-row gap-2"></div>

      <div className="flex w-full justify-center pt-2">
        {showChart ? (
          <Chart
            chartType="AreaChart"
            loader={
              <div className="flex w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-green"></span>
              </div>
            }
            data={localData}
            options={{
              legend: "none",
              animation: {
                duration: 300,
                easing: "linear",
                startup: true,
              },
              lineWidth: 1,
              areaOpacity: 0.1,
              colors: CHART_COLORS,
              curveType: "function",
              title: "",
              pointSize: 0,
              pointShape: "circle",
              enableInteractivity: false,
              hAxis: {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none",
                baselineColor: "transparent",
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
                top: 0,
                right: 0,
                width: "94%",
                height: "38%",
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
                  );
                },
              },
            ]}
          />
        ) : (
          <div className=" mx-4 flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-4 text-center text-xs">
            Not enough data to display
          </div>
        )}
      </div>
    </div>
  );
};
