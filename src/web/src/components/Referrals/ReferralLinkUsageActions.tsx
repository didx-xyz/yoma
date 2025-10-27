import Link from "next/link";
import { useRouter } from "next/router";
import { FaInfoCircle } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { ReferralLinkUsageInfo } from "~/api/models/referrals";
import { getSafeUrl } from "~/lib/utils";

export enum ReferralLinkUsageActionOptions {
  VIEW_DETAILS = "viewDetails",
}

interface ReferralLinkUsageActionsProps {
  usage: ReferralLinkUsageInfo;
  returnUrl?: string;
  actionOptions?: ReferralLinkUsageActionOptions[];
}

export const ReferralLinkUsageActions: React.FC<
  ReferralLinkUsageActionsProps
> = ({
  usage,
  returnUrl,
  actionOptions = [ReferralLinkUsageActionOptions.VIEW_DETAILS],
}) => {
  const router = useRouter();

  return (
    <>
      <div className="dropdown dropdown-left">
        <button type="button" title="Actions" className="cursor-pointer">
          <IoIosSettings className="text-green hover:text-blue size-5" />
        </button>
        <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 gap-2 p-2 shadow">
          {/* VIEW DETAILS */}
          {actionOptions.includes(
            ReferralLinkUsageActionOptions.VIEW_DETAILS,
          ) && (
            <li>
              <Link
                href={`/admin/referrals/${usage.programId}/links/${usage.linkId}/usage/${usage.id}/info${
                  returnUrl
                    ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                    : ""
                }`}
                className="text-gray-dark flex flex-row items-center gap-2 hover:brightness-50"
                title="View Usage Details"
              >
                <FaInfoCircle className="text-green size-4" />
                View Details
              </Link>
            </li>
          )}
        </ul>
      </div>
    </>
  );
};
