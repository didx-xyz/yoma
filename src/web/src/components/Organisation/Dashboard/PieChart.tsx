import Chart from "react-google-charts";

type GoogleChartData = (string | number)[][];

export const PieChart: React.FC<{
  id: string;
  data: GoogleChartData;
  colors?: string[];
  className?: string;
}> = ({ id, data, colors }) => {
  return (
    <div key={id}>
      {data.length > 1 ? (
        <Chart
          height={100}
          chartType="PieChart"
          loader={
            <div className="flex h-full w-full items-center justify-center">
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
            pieSliceText: "value",
            pieSliceTextStyle: {
              color: "black",
              fontSize: 13,
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
        <div className="mt-6 flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-10 text-center text-xs">
          Not enough data to display.
        </div>
      )}
    </div>
  );
};
