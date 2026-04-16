import { useRouter } from "next/router";
import { FaInfoCircle } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { ReferralLinkUsage } from "~/api/models/referrals";
import {
  DropdownMenu,
  DropdownMenuDisplayStyle,
} from "~/components/Common/DropdownMenu";
import { getSafeUrl } from "~/lib/utils";

export enum ReferralLinkUsageActionOptions {
  VIEW_DETAILS = "viewDetails",
}

interface ReferralLinkUsageActionsProps {
  usage: ReferralLinkUsage;
  returnUrl?: string;
  actionOptions?: ReferralLinkUsageActionOptions[];
}

export const AdminReferralLinkUsageActions: React.FC<
  ReferralLinkUsageActionsProps
> = ({
  usage,
  returnUrl,
  actionOptions = [ReferralLinkUsageActionOptions.VIEW_DETAILS],
}) => {
  const router = useRouter();

  const menuItems = [
    ...(actionOptions.includes(ReferralLinkUsageActionOptions.VIEW_DETAILS)
      ? [
          {
            label: "View Details",
            href: `/admin/referrals/${usage.programId}/links/${usage.linkId}/usage/${usage.id}/info${
              returnUrl
                ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl, router.asPath))}`
                : ""
            }`,
            icon: <FaInfoCircle className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <>
      <DropdownMenu
        label="Actions"
        items={menuItems}
        displayStyle={DropdownMenuDisplayStyle.ICON}
        triggerIcon={
          <IoIosSettings className="text-green size-5 hover:brightness-125" />
        }
        title="Actions"
      />
    </>
  );
};
