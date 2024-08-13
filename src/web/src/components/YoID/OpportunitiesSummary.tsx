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
    <div className="rouned-lg col-span-2 flex h-full w-full flex-col items-center justify-center gap-4 bg-white p-4 text-white md:flex-row">
      <span className="flex gap-4">
        <Link
          href="yoid/opportunities/completed"
          style={{
            background: `conic-gradient(from 180deg, #F9AB3E ${completedPercentage}%, #387F6A 0)`,
          }}
          className="flex h-[6rem] w-[6rem] flex-col items-center justify-center rounded-full border-2 border-orange bg-green p-2 text-center shadow-custom md:h-40 md:w-40 md:p-3"
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
            <div className="text-md font-semibold md:text-3xl">
              ✅ {data?.count[0]}
            </div>
            <span className="text-xs md:text-sm ">Completed</span>
          </div>
        </Link>
        <Link
          href="yoid/opportunities/pending"
          style={{
            background: `conic-gradient(from 180deg, #F9AB3E ${pendingPercentage}%, #387F6A 0)`,
          }}
          className="flex h-[6rem] w-[6rem] flex-col items-center  justify-center rounded-full border-2 border-orange bg-green p-2 text-center shadow-custom md:h-40 md:w-40 md:p-3"
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
            <div className="text-md font-semibold md:text-3xl">
              🕑 {data?.count[1]}
            </div>
            <span className="text-xs md:text-sm ">Pending</span>
          </div>
        </Link>
      </span>
      <span className="flex gap-4">
        <Link
          href="yoid/opportunities/rejected"
          style={{
            background: `conic-gradient(from 180deg, #F9AB3E ${rejectedPercentage}%, #387F6A 0)`,
          }}
          className="flex h-[6rem] w-[6rem] flex-col items-center  justify-center rounded-full border-2 border-orange bg-green p-2 text-center shadow-custom md:h-40 md:w-40 md:p-3"
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
            <div className="text-md font-semibold md:text-3xl">
              ❌ {data?.count[2]}
            </div>
            <span className="text-xs md:text-sm ">Rejected</span>
          </div>
        </Link>
        <Link
          href="yoid/opportunities/saved"
          className="flex h-[6rem] w-[6rem] flex-col items-center  justify-center rounded-full border-2 border-orange bg-green p-2 text-center shadow-custom md:h-40  md:w-40 md:p-3"
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-green">
            <div className="text-md font-semibold md:text-3xl">💖 {saved}</div>
            <span className="text-xs md:text-sm ">Saved</span>
          </div>
        </Link>
      </span>
    </div>
  );
};
