import { useRouter } from "next/router";
import { IoWarningOutline } from "react-icons/io5";
import type { UserProfile } from "~/api/models/user";
import NoRowsMessage from "~/components/NoRowsMessage";

interface RequestBlockedViewProps {
  userProfile: UserProfile | null;
}

export const ReferralBlockedView: React.FC<RequestBlockedViewProps> = ({
  userProfile,
}) => {
  const router = useRouter();

  const blockedDate = userProfile?.referral?.blockedDate
    ? new Date(userProfile.referral.blockedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const blockedDescription = `
    <div class="text-center mt-10">
      <p>Your access to the referral program has been temporarily suspended. If you believe this is an error, please contact support.</p>
      ${
        blockedDate
          ? `<p class="text-sm text-gray-600">Suspended on: ${blockedDate}</p>`
          : ""
      }
    </div>
  `;

  return (
    <div className="shadow-custom mb-6 rounded-lg bg-white p-6">
      <div className="flex flex-col items-center justify-center">
        <NoRowsMessage
          title="Referral Access Suspended"
          description={blockedDescription}
          icon={<IoWarningOutline className="h-6 w-6 text-red-500" />}
          className="max-w-3xl !bg-transparent"
        />
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => router.push("/support")}
            className="btn btn-warning btn-sm"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
