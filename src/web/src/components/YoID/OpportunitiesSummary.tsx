import Link from "next/link";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";

export const OpportunitiesSummary: React.FC<{
  data: TimeIntervalSummary | undefined;
}> = ({ data }) => {
  return (
    <div className="rouned-lg grid w-full grid-cols-2 items-center justify-around gap-4 bg-white p-4">
      <Link
        href="yoid/opportunities/completed"
        className="flex flex-grow flex-col rounded-lg border-2 border-dotted border-green bg-green-light p-6 text-center"
      >
        <div className="text-3xl font-semibold">✅ {data?.count[0]}</div>
        <span className="text-sm text-gray-dark">Completed</span>
      </Link>
      <Link
        href="yoid/opportunities/pending"
        className="flex flex-grow flex-col rounded-lg border-2 border-dotted border-blue bg-blue-light p-6 text-center"
      >
        <div className="text-3xl font-semibold">🕑 {data?.count[1]}</div>
        <span className="text-sm text-gray-dark">Pending</span>
      </Link>
      <Link
        href="yoid/opportunities/rejected"
        className="flex flex-grow flex-col rounded-lg border-2 border-dotted border-error bg-red-100 p-6 text-center"
      >
        <div className="text-3xl font-semibold">❌ {data?.count[2]}</div>
        <span className="text-sm text-gray-dark">Rejected</span>
      </Link>
      <Link
        href="yoid/opportunities/saved"
        className="flex flex-grow flex-col rounded-lg border-2 border-dotted border-orange bg-orange-light p-6 text-center"
      >
        <div className="text-3xl font-semibold">💖 {data?.count[3]}</div>
        <span className="text-sm text-gray-dark">Saved</span>
      </Link>
    </div>
  );
};
