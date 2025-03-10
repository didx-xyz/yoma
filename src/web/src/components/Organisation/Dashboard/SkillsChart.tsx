import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import CustomSlider from "~/components/Carousel/CustomSlider";
import { CHART_COLORS } from "~/lib/constants";
import { screenWidthAtom } from "~/lib/store";

export const SkillsChart: React.FC<{
  data: TimeIntervalSummary | undefined;
}> = ({ data }) => {
  const [showChart, setShowChart] = useState<boolean>(true);

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
    setShowChart(!allSameDate);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
  }, [data]);

  const Legend = () => {
    return (
      <>
        {data?.legend.map((name, index) => (
          <div key={index} className="flex select-none flex-col gap-1">
            <div className="flex flex-row items-center gap-3">
              <span className="rounded-lg bg-gray-light p-1">🎖️</span>
              <span className="text-md font-semibold">{name}</span>
            </div>
            {data?.count[index] != null && (
              <div className="mb-2 text-3xl font-semibold">
                {data.count[index]?.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [key, setkey] = useState("");
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`org-skills-chart-${screenWidth}`);
  }, [screenWidth]);

  const chartHeight = useMemo(() => {
    if (screenWidth < 768) {
      return 300;
    } else {
      return 300;
    }
  }, [screenWidth]);

  return (
    <>
      <CustomSlider sliderClassName="!md:gap-8 !gap-4">
        <Legend />
      </CustomSlider>

      {showChart ? (
        <Chart
          key={key}
          chartType="AreaChart"
          loader={
            <div className="flex w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={localData}
          options={{
            legend: "none",
            height: chartHeight,
            lineWidth: 1,
            areaOpacity: 0.1,
            colors: CHART_COLORS,
            curveType: "function",
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
              minValue: 0,
              format: "#",
              gridlines: { color: "#f5f5f5" },
              textStyle: { fontSize: 10 },
            },
            chartArea: {
              left: "10%",
              right: "5%",
              top: "10%",
              bottom: "10%",
            },
          }}
        />
      ) : (
        <div className="mx-4 flex flex-col items-center justify-center rounded-lg bg-gray-light p-4 text-center text-xs">
          Not enough data to display
        </div>
      )}
    </>
  );
};
