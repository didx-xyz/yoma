import { useMemo, useState } from "react";
import Chart from "react-google-charts";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { CHART_COLORS } from "~/lib/constants";
import Image from "next/image";

export const SsoChart: React.FC<{
  data: TimeIntervalSummary | null | undefined;
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
      <div className="flex flex-row gap-2">
        {data?.legend.map((name, index) => (
          <div key={index} className="mt-4 flex flex-col gap-2">
            <div className="flex flex-row items-center gap-3">
              <span className="bg-green-light rounded-lg p-1">
                <Image
                  alt="Login count Icon"
                  src="/images/icon-viewed-green.svg"
                  width={20}
                  height={20}
                />
              </span>
              <span className="text-sm font-semibold">{name}</span>
            </div>
            {data?.count[index] != null && (
              <div className="mb-2 text-3xl font-semibold">
                {data.count[index]?.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-44 w-full overflow-hidden">
      <Legend />
      <div className="flex w-full justify-center pt-2">
        {showChart ? (
          <Chart
            chartType="AreaChart"
            //chartVersion="50" // NB: fixes animation bug in latest verson of google charts. TODO: remove when fixed
            loader={
              <div className="flex w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-green"></span>
              </div>
            }
            data={localData}
            options={{
              legend: "none",
              // animation: {
              //   duration: 300,
              //   easing: "linear",
              //   startup: true,
              // },
              lineWidth: 1,
              areaOpacity: 0.1,
              colors: CHART_COLORS,
              curveType: "function",
              pointSize: 0,
              pointShape: "circle",
              enableInteractivity: false,
              hAxis: {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none",
                baselineColor: "transparent",
              },
              vAxis: {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none",
                baselineColor: "transparent",
              },
              chartArea: {
                left: 0,
                top: 0,
                right: 0,
                width: "100%",
                height: "45%",
              },
            }}
          />
        ) : (
          <div className="bg-gray-light mx-4 flex w-full flex-col items-center justify-center rounded-lg p-4 text-center text-xs">
            Not enough data to display
          </div>
        )}
      </div>
    </div>
  );
};
