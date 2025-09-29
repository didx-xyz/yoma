import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { SettingsRequest } from "~/api/models/common";
import type { Organization } from "~/api/models/organisation";
import {
  getOrganisationSettingsById,
  updateOrganisationSettings,
} from "~/api/services/organisations";
import Suspense from "~/components/Common/Suspense";
import SettingsForm from "~/components/Settings/SettingsForm";
import analytics from "~/lib/analytics";

export interface InputProps {
  organisation: Organization;
}

export const OrgSettingsEdit: React.FC<InputProps> = ({ organisation }) => {
  const queryClient = useQueryClient();
  const {
    data: settingsData,
    isLoading: settingsIsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["organisation", "settings", organisation.id],
    queryFn: async () => await getOrganisationSettingsById(organisation.id),
  });

  // form submission handler
  const handleSubmit = useCallback(
    async (updatedSettings: SettingsRequest) => {
      if (Object.keys(updatedSettings.settings).length === 0) return;

      // call api
      await updateOrganisationSettings(organisation.id, updatedSettings);

      // 📊 ANALYTICS: track organisation settings update
      analytics.trackEvent("organisation_settings_updated", {
        organisationId: organisation.id,
        settingsKeys: Object.keys(updatedSettings.settings || {}),
      });

      // invalidate query
      queryClient.invalidateQueries({
        queryKey: ["organisation", "settings", organisation.id],
      });
    },
    [queryClient, organisation.id],
  );

  return (
    <Suspense isLoading={settingsIsLoading} error={settingsError}>
      <SettingsForm data={settingsData} onSubmit={handleSubmit} />
    </Suspense>
  );
};
