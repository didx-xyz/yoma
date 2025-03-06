import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-google-charts";
import Image from "next/image";
import type { OrganizationSSOInfo } from "~/api/models/organizationDashboard";
import { screenWidthAtom } from "~/lib/store";

export const SsoChartCombined: React.FC<{
  data: OrganizationSSOInfo;
}> = ({ data }) => {
  const [showChart, setShowChart] = useState<boolean>(true);

  const chartData = useMemo<(string | number)[][]>(() => {
    // Set up headers for the chart
    const headers = ["Date", "Outbound", "Inbound"];
    const result: (string | number)[][] = [headers];

    // Collect all unique dates from both outbound and inbound data
    const allDates = new Set<string>();

    // Add outbound dates if available
    if (data.outbound?.enabled && data.outbound.logins?.data) {
      data.outbound.logins.data.forEach((item) => {
        if (item.date) allDates.add(String(item.date));
      });
    }

    // Add inbound dates if available
    if (data.inbound?.enabled && data.inbound.logins?.data) {
      data.inbound.logins.data.forEach((item) => {
        if (item.date) allDates.add(String(item.date));
      });
    }

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();

    // Populate data rows
    sortedDates.forEach((dateStr) => {
      const row: (string | number)[] = [dateStr];

      // Add outbound value for this date (or 0 if none)
      const outboundData = data.outbound?.logins?.data?.find(
        (d) => String(d.date) === dateStr,
      );
      row.push(outboundData?.values?.[0] || 0);

      // Add inbound value for this date (or 0 if none)
      const inboundData = data.inbound?.logins?.data?.find(
        (d) => String(d.date) === dateStr,
      );
      row.push(inboundData?.values?.[0] || 0);

      result.push(row);
    });

    const hasMultipleDates = sortedDates.length > 1;
    setShowChart(hasMultipleDates);

    return result;
  }, [data]);

  // Calculate login totals for display
  const outboundTotal = useMemo(
    () => (data.outbound?.enabled ? data.outbound.logins?.count?.[0] || 0 : 0),
    [data.outbound],
  );

  const inboundTotal = useMemo(
    () => (data.inbound?.enabled ? data.inbound.logins?.count?.[0] || 0 : 0),
    [data.inbound],
  );

  // Chart responsiveness
  const [key, setkey] = useState("");
  const screenWidth = useAtomValue(screenWidthAtom);
  useEffect(() => {
    setkey(`sso-chart-${data.id}-${screenWidth}`);
  }, [screenWidth, data.id]);

  return (
    <div className="mb-4x flex flex-col rounded-lg bg-white p-6 shadow">
      {/* Organization Header */}
      <div className="mb-4x flex items-center gap-3">
        <div className="flex items-center gap-2">
          {!data.logoURL && (
            <div className="rounded-full bg-green-light p-2 text-lg">🏢</div>
          )}
          {data.logoURL && (
            <div className="rounded-full bg-green-light p-2 text-lg">
              <Image
                src={data.logoURL}
                alt={data.name}
                width={32}
                height={32}
                className="h-auto"
                sizes="100vw"
                priority={true}
              />
            </div>
          )}

          <span className="text-lg font-semibold">{data.name}</span>
        </div>
      </div>

      {/* SSO Login Stats */}
      <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Outbound */}
        <div
          className={`flex flex-col gap-2 rounded-lg p-4 ${data.outbound?.enabled ? "bg-green-light" : "bg-yellow-light"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-light p-1">
                <span>➡️</span>
              </div>
              <span className="font-semibold">Outbound SSO</span>
            </div>
            <span className="bg-blue-100 text-blue-600 badge bg-gray">
              {outboundTotal.toLocaleString()} logins
            </span>
          </div>
          {data.outbound?.enabled ? (
            <div className="text-gray-600 truncate text-sm">
              <span className="font-semibold">Client ID:</span>{" "}
              {data.outbound.clientId || "N/A"}
            </div>
          ) : (
            <div className="badge bg-warning text-sm italic text-gray-dark">
              Disabled
            </div>
          )}
        </div>

        {/* Inbound */}
        <div
          className={`flex flex-col gap-2 rounded-lg p-4 ${data.inbound?.enabled ? "bg-green-light" : "bg-yellow-light"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-light p-1">
                <span>⬅️</span>
              </div>
              <span className="font-semibold">Inbound SSO</span>
            </div>
            <span className="bg-purple-100 text-purple-600 badge bg-gray">
              {inboundTotal.toLocaleString()} logins
            </span>
          </div>
          {data.inbound?.enabled ? (
            <div className="text-gray-600 truncate text-sm">
              <span className="font-semibold">Client ID:</span>{" "}
              {data.inbound.clientId || "N/A"}
            </div>
          ) : (
            <div className="badge bg-warning text-sm italic text-gray-dark">
              Disabled
            </div>
          )}
        </div>
      </div>

      {/* Login Chart */}
      {showChart && chartData.length > 1 ? (
        <Chart
          key={key}
          chartType="LineChart"
          loader={
            <div className="flex w-full items-center justify-center p-4">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={chartData}
          options={{
            //colors: [CHART_COLORS[0], CHART_COLORS[1]],
            legend: { position: "top" },
            curveType: "function",
            lineWidth: 2,
            pointSize: 8,
            hAxis: {
              gridlines: { color: "#f5f5f5" },
              format: "MMM dd",
              showTextEvery: 2,
              textStyle: { fontSize: 10 },
            },
            vAxis: {
              gridlines: { color: "#f5f5f5" },
              minValue: 0,
              format: "#",
              textStyle: { fontSize: 10 },
            },
            //height: "250px",
            chartArea: {
              left: "10%",
              top: "15%",
              right: "5%",
              bottom: "15%",
              width: "85%",
              height: "70%",
            },
          }}
        />
      ) : (
        <div className="flex h-[150px] w-full flex-col items-center justify-center rounded-lg bg-gray-light p-4 text-center">
          <span className="text-sm text-gray-dark">
            Not enough data to display chart
          </span>
          {(outboundTotal > 0 || inboundTotal > 0) && (
            <span className="mt-2 text-sm">
              Total: {(outboundTotal + inboundTotal).toLocaleString()} logins
            </span>
          )}
        </div>
      )}
    </div>
  );
};
