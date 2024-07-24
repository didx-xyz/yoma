import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import Chart, { type GoogleChartWrapper } from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { UserProfile } from "~/api/models/user";
import { screenWidthAtom } from "~/lib/store";

export const LineChart: React.FC<{
  data: TimeIntervalSummary;
  userProfile: UserProfile;
}> = ({ data, userProfile }) => {
  const [selectedLegendIndex, setSelectedLegendIndex] = useState<number | null>(
    null,
  );
  const [showLabels, setShowLabels] = useState<boolean>(true);

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
    setShowLabels(!allSameDate);

    return [["Date", ...labels], ...mappedData] as (string | number)[][];
  }, [data]);

  const handleSelect = (chartWrapper: GoogleChartWrapper) => {
    const selection = chartWrapper.getChart().getSelection();
    if (
      selection != null &&
      selection.length > 0 &&
      selection[0]?.column !== null
    ) {
      setSelectedLegendIndex(selection[0]?.column - 1);
    } else {
      setSelectedLegendIndex(null);
    }
  };

  const Legend = () => (
    <div className="flex flex-grow flex-row justify-between gap-4 text-xs md:justify-normal">
      <div className="flex flex-col flex-nowrap gap-2 md:flex-row">
        <span className="flex flex-grow items-center truncate whitespace-nowrap">
          ✅ Completed
        </span>
        <span className="badge badge-xs bg-gray">
          {userProfile?.opportunityCountCompleted}
        </span>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <span className="flex flex-grow items-center truncate whitespace-nowrap">
          ⌛<span className="ml-2">Pending</span>
        </span>
        <span className="badge badge-xs bg-gray">
          {userProfile?.opportunityCountPending}
        </span>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <span className="flex flex-grow items-center truncate whitespace-nowrap">
          😞 Rejected
        </span>
        <span className="badge badge-xs bg-gray">
          {userProfile?.opportunityCountRejected}
        </span>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <span className="flex flex-grow items-center truncate whitespace-nowrap">
          💗 Saved
        </span>
        <span className="badge badge-xs bg-gray">
          {userProfile?.opportunityCountSaved}
        </span>
      </div>
    </div>
  );
  // const Legend = () => (
  //   <div className="ml-0 flex flex-row gap-2 md:ml-3">
  //     <div className="ml-4 mt-2 flex flex-col gap-1">
  //       <div className="flex flex-row items-center gap-2">
  //         <span className="hidden rounded-lg bg-green-light p-1 min-[400px]:inline">
  //           <Image
  //             className="h-3 w-3 md:h-5 md:w-5"
  //             src="/images/icon-skills-green.svg"
  //             alt="Icon"
  //             height={20}
  //             width={20}
  //           />
  //         </span>
  //         <span className="text-xs font-semibold md:text-sm">
  //           Opportunities
  //         </span>
  //       </div>
  //       <div className="w-fit border-b-2 border-green text-sm font-semibold md:text-3xl">
  //         {opportunityCount?.toLocaleString()}
  //       </div>
  //     </div>
  //     {data?.legend.map((name, index) => (
  //       <div
  //         key={index}
  //         className={`ml-0 mt-2 flex flex-col gap-1 md:ml-4 ${
  //           selectedLegendIndex === index ? "selected" : ""
  //         }`}
  //       >
  //         <div className="flex flex-row items-center gap-2">
  //           <span
  //             className={`hidden rounded-lg bg-green-light p-1 min-[400px]:inline`}
  //           >
  //             <Image
  //               className={`h-3 w-3 md:h-5 md:w-5`}
  //               src={`/images/icon-${name.toLowerCase()}-green.svg`}
  //               alt="Icon"
  //               height={20}
  //               width={20}
  //             />
  //           </span>
  //           <span className="text-xs font-semibold md:text-sm">{name}</span>
  //         </div>
  //         {data.count[index] != null && (
  //           <div
  //             className={`w-fit border-b-2 border-green text-sm font-semibold md:text-3xl ${
  //               name === "Viewed" ? "border-dashed" : ""
  //             }`}
  //           >
  //             {data.count[index]?.toLocaleString()}
  //           </div>
  //         )}
  //       </div>
  //     ))}
  //   </div>
  // );

  // chart responsiveness
  // changing the key forces a redraw of the chart when the screen width changes
  const [key, setkey] = useState("");
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`chart-${screenWidth}`);
  }, [screenWidth]);

  return (
    <div className="flex h-full flex-col">
      <Legend />

      {showLabels ? (
        <Chart
          key={key}
          chartType="AreaChart"
          loader={
            <div className="flex h-full w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={localData}
          options={{
            animation: {
              duration: 300,
              easing: "linear",
              startup: true,
            },
            legend: "none",
            lineWidth: 1,
            areaOpacity: 0.1,
            colors: ["#387F6A", "#0000FF", "#FF0000", "#FFA500"], // green, blue, red, orange
            curveType: "function",
            title: "",
            pointSize: 0,
            pointShape: "circle",
            enableInteractivity: true,
            hAxis: {
              gridlines: {
                color: "transparent",
              },
              textPosition: showLabels ? "out" : "none",
              format: "MMM dd",
              showTextEvery: 2,
              textStyle: {
                fontSize: 10,
              },
            },
            vAxis: {
              gridlines: {
                color: "transparent",
              },
              textPosition: "none",
              baselineColor: "transparent",
            },
            width: "100%" as any,
            height: "100%" as any,
            chartArea: {
              left: 0,
              top: -10,
              width: "100%",
              height: "85%",
            },
          }}
          chartEvents={[
            {
              eventName: "select",
              callback: ({ chartWrapper }) => handleSelect(chartWrapper),
            },
          ]}
        />
      ) : (
        <div className="h-full rounded-lg bg-gray-light p-12 text-center text-sm">
          Not enough data to display
        </div>
      )}
    </div>
  );
};
