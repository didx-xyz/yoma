import Chart from "react-google-charts";
import { IoMdHourglass } from "react-icons/io";

type GoogleChartData = (string | number)[][];

export const PieChart: React.FC<{
  id: string;
  title: string;
  subTitle: string;
  data: GoogleChartData;
  colors?: string[];
}> = ({ id, title, subTitle, data, colors }) => {
  return (
    <div
      key={id}
      className="flex h-40 w-72 flex-col gap-0 rounded-lg bg-white p-4 shadow"
    >
      <div className="flex flex-row items-center gap-2">
        <IoMdHourglass className="text-green" />
        <div className="text-sm font-semibold">{title}</div>
      </div>

      <div className="flex flex-grow flex-col">
        <div className="flex-grow text-2xl font-bold">{subTitle}</div>
      </div>

      {data && (
        <Chart
          height={80}
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
