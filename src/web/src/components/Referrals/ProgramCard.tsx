import Link from "next/link";
import Image from "next/image";
import React from "react";
import iconClock from "public/images/icon-clock.svg";
import { type Program, type ProgramInfo } from "~/api/models/referrals";
import ZltoRewardBadge from "../Opportunity/Badges/ZltoRewardBadge";

interface ProgramCardProps {
  data: ProgramInfo | Program;
  zltoReward: number | null;
  onClick?: () => void;
  href?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "referral";
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  data,
  zltoReward,
  onClick,
  href,
  className,
  variant = "default",
}) => {
  if (variant === "referral") {
    const cardClassName = `mx-auto flex h-[17rem] w-full max-w-[18rem] flex-col overflow-hidden rounded-2xl bg-white shadow transition-shadow hover:shadow-md ${onClick || href ? "cursor-pointer" : ""} ${className || ""}`;

    const cardContent = (
      <>
        <div className="relative h-56 w-full">
          {data.imageURL ? (
            <Image
              src={data.imageURL}
              alt={data.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-orange h-full w-full opacity-60"></div>
          )}
        </div>

        <div className="flex h-full flex-col gap-2 p-4">
          <h3 className="font-family-nunitox line-clamp-1 text-base font-semibold text-black">
            {data.name}
          </h3>

          <p className="text-gray-dark line-clamp-3 text-sm leading-relaxed">
            {data.description}
          </p>

          <div className="mt-auto flex items-center gap-2">
            <ZltoRewardBadge amount={zltoReward} />

            {(data.completionWindowInDays ?? 0) > 0 && (
              <span className="badge badge-sm bg-green/20 border border-green-200 whitespace-nowrap text-green-700">
                <Image
                  src={iconClock}
                  alt="Clock"
                  width={16}
                  className="h-auto"
                  sizes="100vw"
                  priority={true}
                />
                <span className="ml-1">{`${data.completionWindowInDays} day${data.completionWindowInDays === 1 ? "" : "s"}`}</span>
              </span>
            )}
          </div>
        </div>
      </>
    );

    if (href) {
      return (
        <Link href={href} className={cardClassName}>
          {cardContent}
        </Link>
      );
    }

    return (
      <div onClick={onClick} className={cardClassName}>
        {cardContent}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`flex h-[15rem] w-64 flex-col overflow-hidden rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md ${onClick ? "cursor-grab" : ""} ${className || ""}`}
    >
      <div className="flex h-full flex-col">
        {/* Row 1: Title */}
        <div className="flex w-full flex-row items-start justify-between">
          <div className="line-clamp-2 pr-2 text-sm leading-tight text-black">
            {data.name}
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="mt-2 mb-4">
          <p className="text-[rgba(84, 88, 89, 1)] line-clamp-3 text-xs font-light text-ellipsis">
            {data.description}
          </p>
        </div>

        {/* Row 3: Image (wide aspect) */}
        <div className="bg-base-200 relative mt-auto h-32 w-full overflow-hidden rounded-sm">
          {data.imageURL ? (
            <Image
              src={data.imageURL}
              alt={data.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-orange h-full w-full opacity-70"></div>
          )}
          {(zltoReward ?? 0) > 0 && (
            <div className="badge badge-sm text-orange absolute right-1 bottom-1 flex-shrink-0 bg-white/95 whitespace-nowrap shadow-lg backdrop-blur-sm">
              🚀 {zltoReward} ZLTO
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
