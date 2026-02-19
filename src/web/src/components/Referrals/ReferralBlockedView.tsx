import Link from "next/link";
import type { UserProfile } from "~/api/models/user";
import NoRowsMessage from "~/components/NoRowsMessage";

interface RequestBlockedViewProps {
  userProfile: UserProfile | null;
}

export const ReferralBlockedView: React.FC<RequestBlockedViewProps> = ({
  userProfile,
}) => {
  const blockedDate = userProfile?.referral?.blockedDate
    ? new Date(userProfile.referral.blockedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const blockedDescription = `
    <div>
      <p>Your access to the referral program has been temporarily suspended. If you believe this is an error, please contact support.</p>
      ${
        blockedDate
          ? `<p class="text-sm text-gray-600">Suspended on: ${blockedDate}</p>`
          : ""
      }
    </div>
  `;

  return (
    <div className="flex flex-col items-center justify-center">
      <NoRowsMessage
        title="Referral Access Suspended"
        description={blockedDescription}
        icon={"🚫"}
        className="max-w-3xl !bg-transparent"
      />

      <Link
        className="btn btn-warning btn-sm text-white"
        href="mailto:help@yoma.world"
      >
        Contact Support
      </Link>
    </div>
  );
};
