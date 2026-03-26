import Image from "next/image";
import { FiUser } from "react-icons/fi";
import { ReferralLinkUsageStatus } from "~/api/models/referrals";
import { ReferralTapCard } from "~/components/Referrals/ReferralTapCard";

interface ReferralFriendSlideCardProps {
  friendName: string;
  programmeName: string;
  referredOn?: string | null;
  status: ReferralLinkUsageStatus | string;
  daysLeft?: number | null;
  href?: string;
  openInNewTab?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStatusIcon = (status: string) => {
  if (status === ReferralLinkUsageStatus.Completed) {
    return "/images/icon-referral-stats-completed.svg";
  }

  if (status === ReferralLinkUsageStatus.Expired) {
    return "/images/icon-referral-stats-expired.svg";
  }

  return "/images/icon-referral-stats-pending.svg";
};

export const ReferralFriendSlideCard = ({
  friendName,
  programmeName,
  referredOn,
  status,
  daysLeft,
  href,
  openInNewTab = false,
}: ReferralFriendSlideCardProps) => {
  const referredOnLabel = formatDate(referredOn);
  const daysLabel =
    status === ReferralLinkUsageStatus.Pending && (daysLeft ?? 0) > 0
      ? ` • ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
      : "";

  const content = (
    <div className="bg-base-200 mx-auto flex h-[13rem] w-[16rem] min-w-[16rem] shrink-0 [touch-action:pan-y] flex-col justify-between rounded-3xl p-4 select-none [-webkit-user-drag:none] [user-drag:none]">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="bg-gray flex h-10 w-10 items-center justify-center rounded-full border border-white/90 text-white shadow-sm">
            <FiUser className="h-5 w-5" />
          </div>

          <h3 className="font-family-nunito line-clamp-1 text-base font-semibold text-black">
            {friendName}
          </h3>
        </div>

        <p className="line-clamp-1 text-sm leading-relaxed text-black">
          {programmeName}
        </p>

        <p className="text-gray-dark text-xs">
          Referred on: {referredOnLabel || "-"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-black/65">
          <Image
            src={getStatusIcon(status)}
            alt={status}
            width={24}
            height={24}
            className="pointer-events-none h-4 w-4 shrink-0"
            draggable={false}
          />
          <span className="truncate text-sm">
            {status}
            {daysLabel}
          </span>
        </div>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <ReferralTapCard
      href={href}
      openInNewTab={openInNewTab}
      className="block w-[16rem] min-w-[16rem] shrink-0"
    >
      {content}
    </ReferralTapCard>
  );
};
