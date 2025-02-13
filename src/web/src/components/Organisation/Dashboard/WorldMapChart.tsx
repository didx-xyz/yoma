import { useAtomValue } from "jotai";
import { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { screenWidthAtom } from "~/lib/store";

type GoogleChartData = (string | number)[][];

export const WorldMapChart: React.FC<{ data: GoogleChartData }> = ({
  data,
}) => {
  const options = {
    colorAxis: { colors: ["#E6F5F3", "#387F6A"] },
    backgroundColor: "#FFFFFF",
    datalessRegionColor: "#f3f6fa",
    defaultColor: "#f3f6fa",
    legend: "none",
  };

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [key, setkey] = useState("");
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`org-countries-chart-${screenWidth}`);
  }, [screenWidth]);

  return (
    <Chart
      key={key}
      chartType="GeoChart"
      width="100%"
      height="100%"
      data={data}
      options={options}
      loader={
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg text-green"></span>
        </div>
      }
    />
  );
};
