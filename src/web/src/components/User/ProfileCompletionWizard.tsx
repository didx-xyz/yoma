import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useRef } from "react";
import { FcCamera, FcSettings, FcViewDetails } from "react-icons/fc";
import { IoCheckmarkCircle } from "react-icons/io5";
import { useSetAtom } from "jotai";
import type { SettingsRequest } from "~/api/models/common";
import type { UserProfile } from "~/api/models/user";
import {
  getSettings,
  updateSettings,
  getUserProfile,
} from "~/api/services/user";
import { SETTING_USER_SETTINGS_CONFIGURED } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import analytics from "~/lib/analytics";
import {
  getProfileCompletionStep,
  isUserProfileCompleted,
  isUserSettingsConfigured,
  hasUserPhoto,
} from "~/lib/utils/profile";
import Suspense from "../Common/Suspense";
import SettingsForm from "../Settings/SettingsForm";
import { UserProfileFilterOptions, UserProfileForm } from "./UserProfileForm";

interface ProfileCompletionWizardProps {
  userProfile: UserProfile | null;
  onComplete?: () => void;
  showHeader?: boolean;
  headerMessage?: string;
}

export const ProfileCompletionWizard: React.FC<
  ProfileCompletionWizardProps
> = ({ userProfile, onComplete, showHeader = true }) => {
  const queryClient = useQueryClient();
  const setUserProfile = useSetAtom(userProfileAtom);
  const [currentStep, setCurrentStep] = useState<string>("profile");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data: settingsData,
    isLoading: settingsIsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["user", "settings"],
    queryFn: async () => await getSettings(),
    enabled: currentStep === "settings",
  });

  const scrollToComponent = useCallback(() => {
    if (containerRef.current) {
      const elementPosition = containerRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  // Update current step based on profile state
  useEffect(() => {
    const step = getProfileCompletionStep(userProfile);
    setCurrentStep(step);

    // Track completed steps
    const completed: string[] = [];
    if (isUserProfileCompleted(userProfile)) completed.push("profile");
    if (isUserSettingsConfigured(userProfile)) completed.push("settings");
    if (hasUserPhoto(userProfile)) completed.push("photo");
    setCompletedSteps(completed);

    // If all steps complete, call onComplete
    if (step === "complete" && onComplete) {
      onComplete();
    }
  }, [userProfile, onComplete]);

  const handleProfileSubmit = useCallback(
    async (updatedUserProfile: UserProfile) => {
      // Track analytics
      analytics.trackEvent("profile_completion_step_completed", {
        step: "profile",
      });

      // Update atom with the updated profile
      setUserProfile(updatedUserProfile);

      // Invalidate userProfile query to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: ["userProfile"],
      });

      // Scroll to component
      scrollToComponent();

      // Move to next step
      setCurrentStep("settings");
    },
    [scrollToComponent, setUserProfile, queryClient],
  );

  const handleSettingsSubmit = useCallback(
    async (updatedSettings: SettingsRequest) => {
      // Ensure that the USER_SETTINGS_CONFIGURED is always set
      updatedSettings.settings[SETTING_USER_SETTINGS_CONFIGURED] = true;

      try {
        // Call API
        await updateSettings(updatedSettings);

        // Track analytics
        analytics.trackEvent("profile_completion_step_completed", {
          step: "settings",
          settingsKeys: Object.keys(updatedSettings.settings),
        });

        // Scroll to component
        scrollToComponent();

        // Invalidate query
        queryClient.invalidateQueries({
          queryKey: ["user", "settings"],
        });

        // Mark as completed and move to next step
        setCompletedSteps((prev) => [...prev, "settings"]);
        setCurrentStep("photo");
      } catch (error) {
        analytics.trackError(error as Error, {
          errorType: "settings_update_error",
        });
        throw error;
      }
    },
    [queryClient],
  );

  const handlePhotoSubmit = useCallback(
    async (updatedUserProfile: UserProfile) => {
      // Track analytics
      analytics.trackEvent("profile_completion_step_completed", {
        step: "photo",
      });

      // Update atom with the updated profile (includes new photo)
      setUserProfile(updatedUserProfile);

      // Invalidate userProfile query to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: ["userProfile"],
      });

      // Scroll to component
      scrollToComponent();

      // Mark as completed and finish
      setCompletedSteps((prev) => [...prev, "photo"]);
      setCurrentStep("complete");

      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      }
    },
    [onComplete, scrollToComponent, setUserProfile, queryClient],
  );

  const handleSkipSettings = useCallback(async () => {
    try {
      // Mark settings as configured when skipped
      const settingsToUpdate: SettingsRequest = {
        settings: {
          [SETTING_USER_SETTINGS_CONFIGURED]: true,
        },
      };

      await updateSettings(settingsToUpdate);

      // Track analytics
      analytics.trackEvent("profile_completion_step_skipped", {
        step: "settings",
      });

      // Scroll to component
      scrollToComponent();

      // Invalidate query
      queryClient.invalidateQueries({
        queryKey: ["user", "settings"],
      });

      // Mark as completed and move to next step
      setCompletedSteps((prev) => [...prev, "settings"]);
      setCurrentStep("photo");
    } catch (error) {
      console.error("Error skipping settings:", error);
      // Still move forward even if update fails
      setCurrentStep("photo");
    }
  }, [queryClient, scrollToComponent]);

  const handleSkipPhoto = useCallback(() => {
    // Track analytics
    analytics.trackEvent("profile_completion_step_skipped", {
      step: "photo",
    });

    // Scroll to component
    scrollToComponent();

    // Mark as completed and finish
    setCompletedSteps((prev) => [...prev, "photo"]);
    setCurrentStep("complete");

    if (onComplete) {
      onComplete();
    }
  }, [onComplete, scrollToComponent]);

  // If profile is complete, don't show anything
  if (currentStep === "complete") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl border-4 border-blue-300 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 shadow-xl md:p-8"
    >
      {/* Header */}
      {showHeader && (
        <div className="mb-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-blue-900 md:text-2xl">
            Your Profile
          </h3>
          <p className="text-sm text-gray-700 md:text-base">
            Complete these quick steps to get started
          </p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-6 flex items-center justify-center gap-2 md:gap-4">
        {/* Step 1: Profile */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 md:h-12 md:w-12 ${
              completedSteps.includes("profile")
                ? "border-green-500 bg-green-500"
                : currentStep === "profile"
                  ? "border-green-500 bg-white"
                  : "border-gray-300 bg-gray-100"
            }`}
          >
            {completedSteps.includes("profile") ? (
              <IoCheckmarkCircle className="h-6 w-6 text-white md:h-8 md:w-8" />
            ) : (
              <FcViewDetails className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </div>
          <span className="text-xs font-semibold text-gray-700 md:text-sm">
            Profile
          </span>
        </div>

        {/* Connector */}
        <div
          className={`h-1 w-8 rounded md:w-16 ${
            completedSteps.includes("profile") ? "bg-green-500" : "bg-gray-300"
          }`}
        />

        {/* Step 2: Settings */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 md:h-12 md:w-12 ${
              completedSteps.includes("settings")
                ? "border-green-500 bg-green-500"
                : currentStep === "settings"
                  ? "border-green-500 bg-white"
                  : "border-gray-300 bg-gray-100"
            }`}
          >
            {completedSteps.includes("settings") ? (
              <IoCheckmarkCircle className="h-6 w-6 text-white md:h-8 md:w-8" />
            ) : (
              <FcSettings className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </div>
          <span className="text-xs font-semibold text-gray-700 md:text-sm">
            Settings
          </span>
        </div>

        {/* Connector */}
        <div
          className={`h-1 w-8 rounded md:w-16 ${
            completedSteps.includes("settings") ? "bg-green-500" : "bg-gray-300"
          }`}
        />

        {/* Step 3: Photo */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 md:h-12 md:w-12 ${
              completedSteps.includes("photo")
                ? "border-green-500 bg-green-500"
                : currentStep === "photo"
                  ? "border-green-500 bg-white"
                  : "border-gray-300 bg-gray-100"
            }`}
          >
            {completedSteps.includes("photo") ? (
              <IoCheckmarkCircle className="h-6 w-6 text-white md:h-8 md:w-8" />
            ) : (
              <FcCamera className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </div>
          <span className="text-xs font-semibold text-gray-700 md:text-sm">
            Photo
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border-2 border-blue-200 bg-white p-4 md:p-6">
        {/* Step 1: Update Profile */}
        {currentStep === "profile" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FcViewDetails className="h-10 w-10" />
                </div>
              </div>
              <h4 className="mb-2 text-lg font-bold text-gray-900 md:text-xl">
                Step 1: Complete Your Profile
              </h4>
              <p className="mb-4 text-sm text-gray-600">
                Your information will be used to issue credentials in your Yo-ID
                wallet
              </p>
            </div>

            <UserProfileForm
              userProfile={userProfile}
              onSubmit={handleProfileSubmit}
              filterOptions={[
                UserProfileFilterOptions.FIRSTNAME,
                UserProfileFilterOptions.SURNAME,
                UserProfileFilterOptions.COUNTRY,
                UserProfileFilterOptions.EDUCATION,
                UserProfileFilterOptions.GENDER,
                UserProfileFilterOptions.DATEOFBIRTH,
              ]}
            />
          </div>
        )}

        {/* Step 2: Settings */}
        {currentStep === "settings" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FcSettings className="h-10 w-10" />
                </div>
              </div>
              <h4 className="mb-2 text-lg font-bold text-gray-900 md:text-xl">
                Step 2: Choose Your Settings
              </h4>
              <p className="mb-4 text-sm text-gray-600">
                Configure your notification and privacy preferences
              </p>
            </div>

            <Suspense isLoading={settingsIsLoading} error={settingsError}>
              <SettingsForm
                data={settingsData}
                onSubmit={handleSettingsSubmit}
              />
            </Suspense>

            <div className="text-center">
              <button
                type="button"
                className="cursor-pointer text-sm text-blue-600 underline hover:text-blue-700"
                onClick={handleSkipSettings}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Photo */}
        {currentStep === "photo" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FcCamera className="h-10 w-10" />
                </div>
              </div>
              <h4 className="mb-2 text-lg font-bold text-gray-900 md:text-xl">
                Step 3: Picture Time!
              </h4>
              <p className="mb-4 text-sm text-gray-600">
                Choose a profile picture to personalize your account
              </p>
            </div>

            <UserProfileForm
              userProfile={userProfile}
              onSubmit={handlePhotoSubmit}
              filterOptions={[UserProfileFilterOptions.LOGO]}
            />

            <div className="text-center">
              <button
                type="button"
                className="cursor-pointer text-sm text-blue-600 underline hover:text-blue-700"
                onClick={handleSkipPhoto}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
