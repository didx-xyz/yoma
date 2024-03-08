import Chart from "react-google-charts";

type GoogleChartData = (string | number)[][];

export const PieChart: React.FC<{
  id: string;
  title: string;
  data: GoogleChartData;
  colors?: string[];
}> = ({ id, title, data, colors }) => {
  return (
    <div
      key={id}
      className="relative w-72 overflow-hidden rounded-lg bg-white pt-10 shadow"
    >
      <div
        className="flex flex-row items-center gap-2"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1 }}
      >
        <div className="text-sm font-semibold">{title}</div>
      </div>

      {data && (
        <Chart
          height={100}
          chartType="PieChart"
          loader={
            <div className="mt-10 flex flex-grow items-center justify-center">
              Loading...
            </div>
          }
          data={data}
          options={{
            legend: { position: "left" }, // Position the legend on the left
            title: "",
            colors: colors,
            chartArea: {
              top: 10, // Reduce the top margin
              width: "90%",
              height: "80%",
            },
          }}
        />
      )}
    </div>
  );
};
