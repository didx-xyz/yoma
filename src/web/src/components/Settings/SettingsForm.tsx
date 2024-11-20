import type { AxiosError } from "axios";
import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import type {
  SettingGroup,
  SettingItem,
  Settings,
  SettingsRequest,
} from "~/api/models/common";
import FormField from "../Common/FormField";
import FormInput from "../Common/FormInput";
import FormLabel from "../Common/FormLabel";
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import FormToggle from "../Common/FormToggle";
import { ApiErrors } from "../Status/ApiErrors";

interface SettingsFormProps {
  data: Settings | undefined;
  onSubmit: (data: SettingsRequest) => Promise<void>;
  onCancel?: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  data,
  onSubmit,
  onCancel,
}) => {
  const [settings, setSettings] = useState(data);
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

  const handleSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      setIsLoading(true);

      const convertSettingsToSettingsRequest = (
        originalSettings: Settings,
        newSettings: Settings,
      ): SettingsRequest => {
        const userRequestSettings: SettingsRequest = { settings: {} };
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

      // parse settings to settings request
      const settingsRequest = convertSettingsToSettingsRequest(
        data!,
        settings!,
      );

      try {
        // call supplied handler
        await onSubmit(settingsRequest);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          autoClose: false,
          icon: false,
        });
      }

      setIsLoading(false);
    },
    [data, settings, setIsLoading, onSubmit],
  );

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
          <div className="flex flex-col gap-4 rounded-lg bg-gray-light p-4">
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

  return (
    <>
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
          <div
            className={`mt-8 flex flex-row items-center justify-center gap-4`}
          >
            {onCancel && (
              <button
                type="button"
                className="btn btn-warning w-1/2 flex-shrink normal-case md:btn-wide"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="btn btn-success w-1/2 flex-shrink normal-case md:btn-wide"
              disabled={isLoading}
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default SettingsForm;
