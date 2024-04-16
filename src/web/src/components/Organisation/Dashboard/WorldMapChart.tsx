// Import the necessary items
import { Chart } from "react-google-charts";

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

  return (
    <div className="m-2 mr-6 flex h-fit flex-col items-center justify-center md:h-[22rem]">
      <Chart
        chartType="GeoChart"
        width="100%"
        height="100%"
        data={data}
        options={options}
        loader={
          <div className="flex w-full items-center justify-center">
            <span className="loading loading-spinner loading-lg text-green"></span>
          </div>
        }
      />
    </div>
  );
};
