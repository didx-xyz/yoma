import type { Opportunity } from "~/api/models/opportunity";
import type { Program } from "~/api/models/referrals";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { ProgramCard } from "~/components/Referrals/ProgramCard";
import { ReferralProgramDetailsContent } from "~/components/Referrals/ReferralProgramDetailsContent";
import { ReferralShell } from "~/components/Referrals/ReferralShell";

interface AdminProgramPreviewProps {
  program: Program;
  imagePreviewUrl?: string | null;
  opportunityDataMap?: Record<string, Opportunity>;
}

export const AdminProgramPreview: React.FC<AdminProgramPreviewProps> = ({
  program,
  imagePreviewUrl,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h6 className="text-sm font-bold">Search Results</h6>

        <FormMessage messageType={FormMessageType.Info}>
          This is how your program will appear in search results.
        </FormMessage>

        <div className="mt-4 flex justify-center">
          <ProgramCard
            data={{
              ...program,
              name: program.name || "Program Name",
              summary: program.summary || "No summary provided",
              description: program.description || "No description provided",
              imageURL: imagePreviewUrl || program.imageURL,
            }}
            zltoReward={program.zltoRewardReferrer}
            variant="referral"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h6 className="text-sm font-bold">Program Page</h6>

        <FormMessage messageType={FormMessageType.Info}>
          This is how your program will appear on the program page when
          navigating from the search results.
        </FormMessage>

        <div className="rounded-xl border border-gray-200 bg-red-700">
          <ReferralShell
            title={program.name || "Referral programme"}
            breadcrumbLabel="Referral Programmes"
            headerBackgroundMode="color"
            headerBackgroundColorClassName="bg-orange"
            onBack={() => {}}
            preview={true}
          >
            <ReferralProgramDetailsContent
              program={{
                ...program,
                imageURL: imagePreviewUrl || program.imageURL,
                summary: program.summary || "No summary provided",
                description: program.description || "No description provided",
              }}
              preview={true}
            />
          </ReferralShell>
        </div>
      </div>
    </div>
  );
};
