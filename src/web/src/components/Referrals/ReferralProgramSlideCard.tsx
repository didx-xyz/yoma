import Image from "next/image";
import { type ReactNode } from "react";
import { FiImage } from "react-icons/fi";
import iconClock from "public/images/icon-clock.svg";
import ZltoRewardBadge from "~/components/Opportunity/Badges/ZltoRewardBadge";
import { ReferralTapCard } from "~/components/Referrals/ReferralTapCard";

interface ReferralProgramSlideCardProps {
  title: string;
  description?: string | null;
  imageURL?: string | null;
  href?: string;
  openInNewTab?: boolean;
  onClick?: () => void;
  reward?: number | null;
  timeDays?: number | null;
  showRewardBadge?: boolean;
  showTimeBadge?: boolean;
  customBadges?: ReactNode;
  className?: string;
}

export const ReferralProgramSlideCard = ({
  title,
  description,
  imageURL,
  href,
  openInNewTab = false,
  onClick,
  reward,
  timeDays,
  showRewardBadge = true,
  showTimeBadge = true,
  customBadges,
  className,
}: ReferralProgramSlideCardProps) => {
  const cardClassName = `mx-auto flex h-[17rem] w-[16rem] min-w-[16rem] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow transition-shadow hover:shadow-md [touch-action:pan-y] select-none [-webkit-user-drag:none] [user-drag:none] ${onClick || href ? "cursor-pointer" : ""} ${className || ""}`;

  const defaultBadges = (
    <>
      {showRewardBadge ? <ZltoRewardBadge amount={reward ?? null} /> : null}
      {showTimeBadge && (timeDays ?? 0) > 0 ? (
        <span className="badge badge-sm bg-green/20 border border-green-200 whitespace-nowrap text-green-700">
          <Image
            src={iconClock}
            alt="Clock"
            width={16}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
          <span className="ml-1">{`${timeDays} day${timeDays === 1 ? "" : "s"}`}</span>
        </span>
      ) : null}
    </>
  );

  const cardContent = (
    <>
      <div className="relative h-56 w-full">
        {imageURL ? (
          <Image
            src={imageURL}
            alt={title}
            fill
            className="pointer-events-none object-cover"
            draggable={false}
          />
        ) : (
          <div className="from-gray-light to-gray flex h-full w-full items-center justify-center bg-gradient-to-br">
            <span className="text-gray-dark inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <FiImage className="h-3.5 w-3.5" aria-hidden="true" />
              No image
            </span>
          </div>
        )}
      </div>

      <div className="flex h-full flex-col gap-2 p-4">
        <h3 className="font-family-nunito line-clamp-1 text-base font-semibold text-black">
          {title}
        </h3>

        <p className="text-gray-dark line-clamp-3 text-sm leading-relaxed">
          {description || "No details available"}
        </p>

        <div className="mt-auto flex items-center gap-2">
          {customBadges ?? defaultBadges}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <ReferralTapCard
        href={href}
        openInNewTab={openInNewTab}
        className={cardClassName}
      >
        {cardContent}
      </ReferralTapCard>
    );
  }

  return (
    <ReferralTapCard onClick={onClick} className={cardClassName}>
      {cardContent}
    </ReferralTapCard>
  );
};
