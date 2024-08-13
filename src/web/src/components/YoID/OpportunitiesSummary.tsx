import Link from "next/link";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";

export const OpportunitiesSummary: React.FC<{
  data: TimeIntervalSummary | undefined;
}> = ({ data }) => {
  const [completed = 0, pending = 0, rejected = 0, saved = 0] =
    data?.count || [];

  const total = completed + pending + rejected;
  const calculatePercentage = (count: number) =>
    total ? (count / total) * 100 : 0;

  const completedPercentage = calculatePercentage(completed);
  const pendingPercentage = calculatePercentage(pending);
  const rejectedPercentage = calculatePercentage(rejected);
  return (
    <div className="rouned-lg grid h-full w-full grid-cols-2 items-center justify-between gap-4 bg-white p-4 text-white md:flex">
      <Link
        href="yoid/opportunities/completed"
        style={{
          background: `conic-gradient(from 180deg, #F9AB3E ${completedPercentage}%, #387F6A 0)`,
        }}
        className="flex aspect-square h-32 flex-col  items-center justify-center rounded-full border-2 border-orange bg-green p-3 text-center shadow-custom md:h-40"
      >
        <div className="flex aspect-square h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
          <div className="text-2xl font-semibold md:text-3xl">
            ✅ {data?.count[0]}
          </div>
          <span className="text-sm ">Completed</span>
        </div>
      </Link>
      <Link
        href="yoid/opportunities/pending"
        style={{
          background: `conic-gradient(from 180deg, #F9AB3E ${pendingPercentage}%, #387F6A 0)`,
        }}
        className="flex aspect-square h-32 flex-col  items-center justify-center rounded-full border-2 border-orange bg-green p-3 text-center shadow-custom md:h-40"
      >
        <div className="flex aspect-square h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
          <div className="text-2xl font-semibold md:text-3xl">
            🕑 {data?.count[1]}
          </div>
          <span className="text-sm ">Pending</span>
        </div>
      </Link>
      <Link
        href="yoid/opportunities/rejected"
        style={{
          background: `conic-gradient(from 180deg, #F9AB3E ${rejectedPercentage}%, #387F6A 0)`,
        }}
        className="flex aspect-square h-32 flex-col  items-center justify-center rounded-full border-2 border-orange bg-green p-3 text-center shadow-custom md:h-40"
      >
        <div className="flex aspect-square h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
          <div className="text-2xl font-semibold md:text-3xl">
            ❌ {data?.count[2]}
          </div>
          <span className="text-sm ">Rejected</span>
        </div>
      </Link>
      <Link
        href="yoid/opportunities/saved"
        className="flex aspect-square h-32 flex-col  items-center justify-center rounded-full border-2 border-orange bg-green p-3 text-center  shadow-custom md:h-40"
      >
        <div className="flex aspect-square h-full w-full flex-col items-center justify-center rounded-full bg-green">
          <div className="text-2xl font-semibold md:text-3xl">💖 {saved}</div>
          <span className="text-sm ">Saved</span>
        </div>
      </Link>
    </div>
  );
};
