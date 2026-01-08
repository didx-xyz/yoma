import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { useCallback, type ReactElement } from "react";
import { toast } from "react-toastify";
import type { SettingsRequest } from "~/api/models/common";
import { getSettings, updateSettings } from "~/api/services/user";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import SettingsForm from "~/components/Settings/SettingsForm";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { setRumSoftEnabled } from "~/lib/datadog";
import {
  SETTING_USER_RUM_CONSENT,
  SETTING_USER_SETTINGS_CONFIGURED,
} from "~/lib/constants";
import analytics from "~/lib/analytics";
import { config } from "~/lib/react-query-config";
import { userProfileAtom } from "~/lib/store";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["user", "settings"],
    queryFn: async () => await getSettings(context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const MySettings: NextPageWithLayout<{
  error?: string;
}> = ({ error }) => {
  const queryClient = useQueryClient();
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const {
    data: settingsData,
    isLoading: settingsIsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["user", "settings"],
    queryFn: async () => await getSettings(),
    enabled: !error,
  });

  const handleSubmit = useCallback(
    async (updatedSettings: SettingsRequest) => {
      // ensure that the USER_SETTINGS_CONFIGURED is always set
      // this prevents the "please update your settings" popup from showing again (Global.tsx)
      updatedSettings.settings[SETTING_USER_SETTINGS_CONFIGURED] = true;

      // Apply soft enable/disable immediately so our wrapper emissions stop/start
      // without waiting for the API round-trip.
      if (updatedSettings.settings?.[SETTING_USER_RUM_CONSENT] === false) {
        setRumSoftEnabled(false);
      }
      if (updatedSettings.settings?.[SETTING_USER_RUM_CONSENT] === true) {
        setRumSoftEnabled(true);
      }

      // call api
      const updatedProfile = await updateSettings(updatedSettings);
      const mergedProfile = userProfile
        ? {
            ...userProfile,
            settings: updatedProfile.settings ?? userProfile.settings,
          }
        : updatedProfile;
      setUserProfile(mergedProfile);

      // 📊 ANALYTICS: track settings update
      analytics.trackEvent("settings_updated", {
        settingsKeys: Object.keys(updatedSettings.settings),
      });

      // invalidate query
      queryClient.invalidateQueries({
        queryKey: ["user", "settings"],
      });

      toast.success("Settings updated");
    },
    [queryClient, setUserProfile, userProfile],
  );

  const handleCancel = () => {
    router.back();
  };

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | ⚙️ Settings</title>
      </Head>

      <PageBackground />

      <div className="z-10 mt-20 w-full max-w-2xl p-4 md:mt-24">
        <div className="mb-4 text-xs font-bold tracking-wider text-white md:text-base">
          ⚙️ Settings
        </div>

        <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
          <Suspense isLoading={settingsIsLoading} error={settingsError}>
            <SettingsForm
              data={settingsData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
};

MySettings.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default MySettings;
