import Chart from "react-google-charts";

type GoogleChartData = (string | number)[][];

export const PieChart: React.FC<{
  id: string;
  data: GoogleChartData;
  colors?: string[];
  className?: string;
}> = ({ id, data, colors }) => {
  const hasValidData =
    data.length > 1 &&
    data.slice(1).every((row) => {
      return row.length === 2 && typeof row[1] === "number" && row[1] > 0;
    });

  // Create a derived data array with formatted labels: "label (value)"
  const chartData = hasValidData
    ? data.map((row, index) =>
        index === 0 ? row : [`${row[0]}\n(${row[1]} total)`, row[1]],
      )
    : data;

  return (
    <div key={id}>
      {hasValidData ? (
        <Chart
          height={100}
          chartType="PieChart"
          loader={
            <div className="flex h-full w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={chartData}
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
            pieSliceTextStyle: {
              color: "transparent",
            },
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
        <div className="bg-gray-light mt-6 flex w-full flex-col items-center justify-center rounded-lg p-10 text-center text-xs">
          Not enough data to display.
        </div>
      )}
    </div>
  );
};
