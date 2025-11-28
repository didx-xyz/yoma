import { useQuery } from "@tanstack/react-query";
import { IoGift } from "react-icons/io5";
import type { ProgramInfo } from "~/api/models/referrals";
import { getReferralProgramInfoById } from "~/api/services/referrals";
import Suspense from "~/components/Common/Suspense";
import { RefereeProgramDetails } from "./RefereeProgramDetails";
import { ProgramRequirements } from "./ProgramRequirements";

interface ProgramPreviewProps {
  linkId: string;
  programId: string;
}

export const ReferrerProgramPreview: React.FC<ProgramPreviewProps> = ({
  linkId,
  programId,
}) => {
  const {
    data: programData,
    isLoading,
    error,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgramInfo", programId],
    queryFn: () => getReferralProgramInfoById(programId),
    enabled: !!programId,
  });

  if (!programData && !isLoading) return null;

  return (
    <Suspense isLoading={isLoading} error={error as any}>
      {programData && (
        <div
        //className="space-y-3 rounded-lg bg-white p-4 md:p-6"
        >
          <div>
            {/* Header */}
            <div className="mb-3">
              <h3 className="flex items-center gap-2 text-base font-bold">
                <IoGift className="h-5 w-5 text-orange-400" />
                Selected Program
              </h3>
            </div>
            <div className="bg-white">
              <RefereeProgramDetails
                program={programData}
                context="preview"
                perspective="referrer"
              />
            </div>
          </div>
          <ProgramRequirements program={programData} showPathway={true} />
        </div>
      )}
    </Suspense>
  );
};
