import Chart from "react-google-charts";

type GoogleChartData = (string | number)[][];

export const PieChart: React.FC<{
  id: string;
  title: string;
  subTitle: string;
  data: GoogleChartData;
  colors?: string[];
  className?: string;
}> = ({ id, title, subTitle, data, colors, className = "" }) => {
  return (
    <div
      key={id}
      className={`flex h-44 w-full flex-grow flex-col gap-0 overflow-hidden rounded-lg bg-white p-4 shadow md:h-[11rem] md:w-[20.75rem] md:px-6 ${className}`}
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
            pieSliceText: "none",
            chartArea: {
              top: 10,
              bottom: 10,
              right: 0,
              width: "100%",
              height: "100%",
            },
            tooltip: {
              trigger: "selection",
            },
          }}
        />
      ) : (
        <div className="mt-6 flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-10 text-center text-xs">
          No data
        </div>
      )}
    </div>
  );
};
