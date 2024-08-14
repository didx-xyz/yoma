import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { SettingsRequest } from "~/api/models/common";
import type { Organization } from "~/api/models/organisation";
import {
  getOrganisationSettingsById,
  updateOrganisationSettings,
} from "~/api/services/organisations";
import Suspense from "~/components/Common/Suspense";
import SettingsForm from "~/components/Settings/SettingsForm";
import {
  GA_ACTION_APP_SETTING_UPDATE,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";

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

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_USER,
        GA_ACTION_APP_SETTING_UPDATE,
        JSON.stringify(updatedSettings),
      );

      // invalidate query
      queryClient.invalidateQueries({
        queryKey: ["organisation", "settings", organisation.id],
      });
    },
    [queryClient],
  );

  return (
    <Suspense isLoading={settingsIsLoading} error={settingsError}>
      <SettingsForm data={settingsData} onSubmit={handleSubmit} />
    </Suspense>
  );
};
