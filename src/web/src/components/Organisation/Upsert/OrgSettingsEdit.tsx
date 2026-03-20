import { useQuery } from "@tanstack/react-query";
import type { SettingsRequest } from "~/api/models/common";
import type { Organization } from "~/api/models/organisation";
import { getOrganisationSettingsById } from "~/api/services/organisations";
import Suspense from "~/components/Common/Suspense";
import SettingsForm from "~/components/Settings/SettingsForm";

export interface InputProps {
  organisation: Organization;
  onSubmit?: (updatedSettings: SettingsRequest) => Promise<void>;
}

export const OrgSettingsEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
}) => {
  const {
    data: settingsData,
    isLoading: settingsIsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["organisation", "settings", organisation.id],
    queryFn: async () => await getOrganisationSettingsById(organisation.id),
  });

  return (
    <Suspense isLoading={settingsIsLoading} error={settingsError}>
      <SettingsForm
        data={settingsData}
        onSubmit={async (updatedSettings) => {
          if (onSubmit) await onSubmit(updatedSettings);
        }}
      />
    </Suspense>
  );
};
