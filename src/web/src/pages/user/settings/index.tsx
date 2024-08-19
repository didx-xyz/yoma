import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { useCallback, type ReactElement } from "react";
import type { SettingsRequest } from "~/api/models/common";
import { getSettings, updateSettings } from "~/api/services/user";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import SettingsForm from "~/components/Settings/SettingsForm";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  GA_ACTION_APP_SETTING_UPDATE,
  GA_CATEGORY_USER,
  SETTING_USER_SETTINGS_CONFIGURED,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { config } from "~/lib/react-query-config";
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

      // call api
      await updateSettings(updatedSettings);

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_USER,
        GA_ACTION_APP_SETTING_UPDATE,
        JSON.stringify(updatedSettings),
      );

      // invalidate query
      queryClient.invalidateQueries({
        queryKey: ["user", "settings"],
      });
    },
    [queryClient],
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

      <PageBackground className="h-[16rem]" />

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
