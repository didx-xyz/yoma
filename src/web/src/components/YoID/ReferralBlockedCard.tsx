import { useRouter } from "next/router";
import { IoWarning } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa";

interface ReferralBlockedCardProps {
  blockedDate?: string;
  onClick?: () => void;
}

export const ReferralBlockedCard: React.FC<ReferralBlockedCardProps> = ({
  blockedDate,
  onClick,
}) => {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col gap-3 text-xs text-black md:text-sm">
      <div className="flex items-start gap-2">
        <IoWarning className="text-orange mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-orange font-semibold">Referral Access Suspended</p>
          <p className="text-gray-dark mt-1 text-xs">
            Your referral program access has been temporarily suspended.
          </p>
          {blockedDate && (
            <p className="text-gray-dark mt-1 text-xs">
              Since:{" "}
              {new Date(blockedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {/* TODO: Show block reason and comments when available from API */}
        </div>
      </div>

      <div className="border-gray-light mt-2 border-t pt-3">
        <button
          onClick={() => {
            onClick?.();
            router.push("/support");
          }}
          className="text-green hover:text-green-dark flex w-full items-center justify-between text-xs font-semibold underline"
        >
          <span>Contact Support</span>
          <FaArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
