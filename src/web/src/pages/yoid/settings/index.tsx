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
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormLabel from "~/components/Common/FormLabel";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import FormToggle from "~/components/Common/FormToggle";
import Suspense from "~/components/Common/Suspense";
import YoIDLayout from "~/components/Layout/YoID";
import { ApiErrors } from "~/components/Status/ApiErrors";
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

const MySettings: NextPageWithLayout<{
  error?: string;
}> = ({ error }) => {
  const queryClient = useQueryClient();
  const {
    data: settingsData,
    isLoading: settingsIsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["userProfileAppSettings"],
    queryFn: async () => await getSettings(),
    enabled: !error,
  });
  const [settings, setSettings] = useState(settingsData);
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

  const renderGroup = (
    group: SettingGroup,
    depth: number,
  ): JSX.Element | null => {
    const visibleItems = group.items?.filter((item) => item.visible) || [];

    return (
      <div
        className="flex flex-col gap-2"
        key={`${group.group}_${depth}`}
        style={{
          marginBottom:
            !!visibleItems?.length || !!group.groups?.length ? "16px" : "0px",
        }}
      >
        {(!!visibleItems?.length || !!group.groups?.length) && (
          <div
            className="font-bold"
            style={{ fontSize: `${1 - depth * 0.2}rem` }}
          >
            {group.group}
          </div>
        )}

        {!!visibleItems?.length && (
          <div className="flex flex-col gap-4 rounded-lg bg-white p-4">
            {visibleItems?.map((item: SettingItem) => (
              <div key={`${group.group}_${depth}_${item.key}`}>
                {item.type == "Boolean" && (
                  <div className="flex flex-row items-center gap-2">
                    <div className="w-full">
                      <FormLabel
                        label={item.title}
                        subLabel={item.description}
                        showWarningIcon={false}
                      />
                    </div>
                    <FormToggle
                      id={item.key}
                      label=""
                      inputProps={{
                        checked: item.value,
                        onChange: (e) =>
                          handleInputChange(depth, item.key, e.target.checked),
                        disabled: !item.enabled,
                      }}
                    />
                  </div>
                )}
                {item.type == "Number" && (
                  <FormField label={item.title} subLabel={item.description}>
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
                  <FormField label={item.title} subLabel={item.description}>
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
          </div>
        )}

        {group.groups?.map((subGroup) => renderGroup(subGroup, depth + 1))}
      </div>
    );
  };

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
        settingsData!,
        settings!,
      );

      // ensure that the USER_SETTINGS_CONFIGURED is always set
      // this prevents the "please update your settings" popup from showing again (Global.tsx)
      userRequestSettings.settings[SETTING_USER_SETTINGS_CONFIGURED] = true;

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
        queryClient.invalidateQueries({
          queryKey: ["userProfileAppSettings"],
        });

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
    [settingsData, settings, queryClient, setIsLoading],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | 🔧 Settings</title>
      </Head>

      <div className="max-w-2xl">
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🔧 Settings",
                selected: true,
              },
            ]}
          />
        </div>

        <div className="flex w-full flex-col items-center">
          <Suspense isLoading={settingsIsLoading} error={settingsError}>
            {!settings && (
              <FormMessage messageType={FormMessageType.Warning}>
                No settings available
              </FormMessage>
            )}

            {settings && (
              <form onSubmit={handleSubmit}>
                {/* GROUPS */}
                {settings.groups.map((group) => renderGroup(group, 0))}

                {/* BUTTONS */}
                <div className="flex items-center justify-center gap-4 md:justify-end">
                  <button
                    type="submit"
                    className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                    disabled={isLoading}
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </Suspense>
        </div>
      </div>
    </>
  );
};

MySettings.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default MySettings;
