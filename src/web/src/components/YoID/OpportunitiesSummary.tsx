import Link from "next/link";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";

interface MenuItem {
  href: string;
  background: string;
  count: number;
  label: string;
  emoji: string;
}

export const OpportunitiesSummary: React.FC<{
  data: TimeIntervalSummary | undefined;
  showSaved?: boolean;
}> = ({ data, showSaved }) => {
  const [completed = 0, pending = 0, rejected = 0, saved = 0] =
    data?.count || [];

  const total = completed + pending + rejected;
  const calculatePercentage = (count: number) =>
    total ? (count / total) * 100 : 0;

  const completedPercentage = calculatePercentage(completed);
  const pendingPercentage = calculatePercentage(pending);
  const rejectedPercentage = calculatePercentage(rejected);

  const menuItems: MenuItem[] = [
    {
      href: "yoid/opportunities/completed",
      background: `conic-gradient(from 180deg, #F9AB3E ${completedPercentage}%, #387F6A 0)`,
      count: data?.count[0] || 0,
      label: "Completed",
      emoji: "✅",
    },
    {
      href: "yoid/opportunities/pending",
      background: `conic-gradient(from 180deg, #F9AB3E ${pendingPercentage}%, #387F6A 0)`,
      count: data?.count[1] || 0,
      label: "Pending",
      emoji: "🕑",
    },
    {
      href: "yoid/opportunities/rejected",
      background: `conic-gradient(from 180deg, #F9AB3E ${rejectedPercentage}%, #387F6A 0)`,
      count: data?.count[2] || 0,
      label: "Rejected",
      emoji: "❌",
    },
  ];

  if (showSaved) {
    menuItems.push({
      href: "yoid/opportunities/saved",
      background: "",
      count: saved,
      label: "Saved",
      emoji: "💖",
    });
  }

  return (
    <div className="flex flex-row gap-3">
      {menuItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          style={{ background: item.background }}
          className="flex aspect-square w-[30%] min-w-[80px] flex-col items-center justify-center rounded-full border-2 border-orange bg-green p-2 text-center text-white shadow-custom"
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-orange bg-green">
            <div className="whitespace-nowrap text-sm font-semibold">
              {item.emoji} {item.count}
            </div>
            <span className="text-sx -mt-3x" style={{ fontSize: "0.65rem" }}>
              {item.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};
