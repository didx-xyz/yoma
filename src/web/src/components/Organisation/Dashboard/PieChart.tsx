import Chart from "react-google-charts";
import { useEffect, useState } from "react";

type GoogleChartData = (string | number)[][];

export const PieChart: React.FC<{
  id: string;
  title: string;
  subTitle: string;
  data: GoogleChartData;
  colors?: string[];
  className?: string;
  width?: number;
}> = ({ id, title, subTitle, data, colors, width = 0, className = "" }) => {
  const [chartWidth, setChartWidth] = useState(width);
  const [marginRight, setMarginRight] = useState(0);

  // Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 360) {
        setChartWidth(0);
        setMarginRight(110);
      } else if (window.innerWidth >= 360 && window.innerWidth < 411) {
        setChartWidth(0);
        setMarginRight(60);
      } else if (window.innerWidth >= 411 && window.innerWidth < 768) {
        setChartWidth(0);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size adjustment

    return () => window.removeEventListener("resize", handleResize);
  }, [chartWidth]);

  return (
    <div
      key={id}
      className={`flex h-44 flex-grow flex-col gap-0 overflow-hidden rounded-lg bg-white p-4 shadow md:px-6 ${className}`}
    >
      <div className="flex flex-row items-center gap-2 tracking-wide">
        <div className="text-sm font-semibold">{title}</div>
      </div>

      <div className="flex flex-col">
        <div className="flex-grow text-3xl font-semibold">{subTitle}</div>
      </div>

      {data.length > 1 ? (
        <Chart
          height={100}
          chartType="PieChart"
          loader={
            <div className="flex w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={data}
          style={{ width: chartWidth }}
          options={{
            legend: {
              position: "left",
              alignment: "center",
              textStyle: {
                fontSize: 13,
                color: "#565B6F",
              },
            },
            title: "",
            colors: colors,
            pieHole: 0.7,
            height: 125,
            backgroundColor: "transparent",
            width: chartWidth,
            pieSliceText: "none",
            chartArea: {
              top: 10,
              bottom: 10,
              right: marginRight,
              width: "100%",
              height: "100%",
            },
            tooltip: {
              trigger: "selection",
            },
          }}
        />
      ) : (
        <div className="mt-10 flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-4 text-center text-xs">
          No data
        </div>
      )}
    </div>
  );
};
