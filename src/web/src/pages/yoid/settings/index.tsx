import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useCallback, useState, type ReactElement } from "react";
import { toast } from "react-toastify";
import type {
  SettingGroup,
  SettingItem,
  Settings,
  UserRequestSettings,
} from "~/api/models/user";
import { getSettings, updateSettings } from "~/api/services/user";
import Breadcrumb from "~/components/Breadcrumb";
import FormCheckbox from "~/components/Common/FormCheckbox";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import FormTooltip from "~/components/Common/FormTooltip";
import YoIDTabbedLayout from "~/components/Layout/YoIDTabbed";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  GA_ACTION_APP_SETTING_UPDATE,
  GA_CATEGORY_USER,
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
    queryKey: ["userProfileAppSettings"],
    queryFn: async () => await getSettings(context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const AppSettings: NextPageWithLayout<{
  error?: string;
}> = ({ error }) => {
  const queryClient = useQueryClient();
  const { data: dataSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["userProfileAppSettings"],
    queryFn: async () => await getSettings(),
    enabled: !error,
  });
  const [settings, setSettings] = useState(dataSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (depth: number, itemKey: string, newValue: any) => {
    // Clone the settings to avoid direct state mutation
    const newSettings: Settings = JSON.parse(JSON.stringify(settings));

    // Function to recursively find and update the setting item
    const updateSettingItem = (
      currentGroup: SettingGroup[],
      currentDepth: number,
    ) => {
      if (currentDepth === depth) {
        // We are at the correct depth, now find and update the item
        currentGroup.forEach((group) => {
          const item = group.items?.find((item) => item.key === itemKey);
          if (item) {
            item.value = newValue;
          } else {
            // If not found in items, recursively update in nested groups
            if (group.groups) {
              updateSettingItem(group.groups, currentDepth + 1);
            }
          }
        });
      } else {
        // Not at the correct depth, dive deeper into the groups
        currentGroup.forEach((group) => {
          if (group.groups) {
            updateSettingItem(group.groups, currentDepth + 1);
          }
        });
      }
    };

    // Start the recursive update from the root
    updateSettingItem(newSettings.groups, 0);

    setSettings(newSettings);
  };

  const renderGroup = (group: SettingGroup, depth: number): JSX.Element => (
    <div className="mb-2 flex flex-col gap-2" key={`${group.group}_${depth}`}>
      <div
        className="font-bold"
        style={{ fontSize: `${1.2 - depth * 0.3}rem` }}
      >
        {group.group}
      </div>

      {group.items?.map((item: SettingItem) => (
        <div key={`${group.group}_${depth}_${item.key}`}>
          {item.type == "Boolean" && (
            <div className="flex flex-row items-center gap-2">
              <FormCheckbox
                id={item.key}
                label={item.title}
                inputProps={{
                  checked: item.value,
                  onChange: (e) =>
                    handleInputChange(depth, item.key, e.target.checked),
                  disabled: !item.enabled,
                }}
              />
              <FormTooltip label={item.description} />
            </div>
          )}
          {item.type == "Number" && (
            <FormField label={item.title} tooltip={item.description}>
              <FormInput
                inputProps={{
                  type: "number",
                  value: item.value,
                  onChange: (e) =>
                    handleInputChange(depth, item.key, e.target.value),
                  disabled: !item.enabled,
                }}
              />
            </FormField>
          )}
          {item.type == "String" && (
            <FormField label={item.title} tooltip={item.description}>
              <FormInput
                inputProps={{
                  type: "text",
                  value: item.value,
                  onChange: (e) =>
                    handleInputChange(depth, item.key, e.target.value),
                  disabled: !item.enabled,
                }}
              />
            </FormField>
          )}
        </div>
      ))}
      {group.groups?.map((subGroup) => renderGroup(subGroup, depth + 1))}
    </div>
  );

  const handleSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();

      setIsLoading(true);

      const convertSettingsToUserRequestSettings = (
        originalSettings: Settings,
        newSettings: Settings,
      ): UserRequestSettings => {
        const userRequestSettings: UserRequestSettings = { settings: {} };

        const compareAndExtractChanges = (
          original: SettingGroup[],
          updated: SettingGroup[],
          path: string,
        ) => {
          updated.forEach((updatedGroup) => {
            const originalGroup = original.find(
              (group) => group.group === updatedGroup.group,
            );
            if (!originalGroup) return; // If the group doesn't exist in the original settings, skip it

            updatedGroup.items?.forEach((updatedItem) => {
              const originalItem = originalGroup.items?.find(
                (item) => item.key === updatedItem.key,
              );
              if (!originalItem) return; // If the item doesn't exist in the original settings, skip it

              // Compare values; if different, add to userRequestSettings
              if (originalItem.value !== updatedItem.value) {
                userRequestSettings.settings[updatedItem.key] =
                  updatedItem.value;
              }
            });

            // Recursively handle nested groups
            if (updatedGroup.groups && originalGroup.groups) {
              compareAndExtractChanges(
                originalGroup.groups,
                updatedGroup.groups,
                `${path}${updatedGroup.group}.`,
              );
            }
          });
        };

        compareAndExtractChanges(
          originalSettings.groups,
          newSettings.groups,
          "",
        );

        return userRequestSettings;
      };

      // format settings into UserRequestSettings and send to server
      const userRequestSettings = convertSettingsToUserRequestSettings(
        dataSettings!,
        settings!,
      );

      try {
        // call api
        await updateSettings(userRequestSettings);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_USER,
          GA_ACTION_APP_SETTING_UPDATE,
          JSON.stringify(userRequestSettings),
        );

        // invalidate query
        queryClient.invalidateQueries({ queryKey: ["userProfileAppSettings"] });

        toast.success("Settings updated");
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          autoClose: false,
          icon: false,
        });
      }

      setIsLoading(false);
    },
    [dataSettings, settings, queryClient, setIsLoading],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | ⚙ Settings</title>
      </Head>

      <div className="w-full max-w-2xl">
        <h5 className="mb-4 font-bold tracking-wider text-black">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "⚙ Settings",
                selected: true,
              },
            ]}
          />
        </h5>

        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
            {(isLoading || isLoadingSettings) && <Loading />}

            {!isLoadingSettings && !settings && (
              <FormMessage messageType={FormMessageType.Warning}>
                No settings available
              </FormMessage>
            )}

            {!isLoadingSettings && settings && (
              <form onSubmit={handleSubmit}>
                {/* GROUPS */}
                {settings.groups.map((group) => renderGroup(group, 0))}

                {/* BUTTONS */}
                <div className="flex items-center justify-center gap-4 md:justify-end">
                  <button
                    type="submit"
                    className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

AppSettings.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedLayout>{page}</YoIDTabbedLayout>;
};

export default AppSettings;
